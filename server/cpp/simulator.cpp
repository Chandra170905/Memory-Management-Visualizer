#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <map>
#include <sstream>
#include <string>
#include <vector>

struct Input {
  int frames = 0;
  std::string algorithm;
  std::vector<int> reference;
};

static std::string readAllStdin() {
  std::ostringstream ss;
  ss << std::cin.rdbuf();
  return ss.str();
}

static void jsonFail(const std::string& message) {
  std::cout << "{\"ok\":false,\"error\":\"";
  for (char c : message) {
    if (c == '\\' || c == '"') std::cout << '\\' << c;
    else if (c == '\n') std::cout << "\\n";
    else std::cout << c;
  }
  std::cout << "\"}\n";
}

static int skipWs(const std::string& s, int i) {
  while (i < (int)s.size() && std::isspace((unsigned char)s[i])) i++;
  return i;
}

static bool consume(const std::string& s, int& i, char ch) {
  i = skipWs(s, i);
  if (i < (int)s.size() && s[i] == ch) {
    i++;
    return true;
  }
  return false;
}

static bool consumeLiteral(const std::string& s, int& i, const std::string& lit) {
  i = skipWs(s, i);
  if (s.compare(i, (int)lit.size(), lit) == 0) {
    i += (int)lit.size();
    return true;
  }
  return false;
}

static bool parseString(const std::string& s, int& i, std::string& out) {
  i = skipWs(s, i);
  if (i >= (int)s.size() || s[i] != '"') return false;
  i++;
  std::ostringstream ss;
  while (i < (int)s.size()) {
    char c = s[i++];
    if (c == '"') break;
    if (c == '\\') {
      if (i >= (int)s.size()) return false;
      char e = s[i++];
      if (e == '"' || e == '\\' || e == '/') ss << e;
      else if (e == 'n') ss << '\n';
      else if (e == 't') ss << '\t';
      else return false;
    } else {
      ss << c;
    }
  }
  out = ss.str();
  return true;
}

static bool parseNumber(const std::string& s, int& i, int& out) {
  i = skipWs(s, i);
  int start = i;
  if (i < (int)s.size() && (s[i] == '-' || s[i] == '+')) i++;
  bool any = false;
  while (i < (int)s.size() && std::isdigit((unsigned char)s[i])) {
    any = true;
    i++;
  }
  if (!any) {
    i = start;
    return false;
  }
  long long v = std::atoll(s.substr(start, i - start).c_str());
  if (v < std::numeric_limits<int>::min() || v > std::numeric_limits<int>::max())
    return false;
  out = (int)v;
  return true;
}

static bool parseIntArray(const std::string& s, int& i, std::vector<int>& out) {
  if (!consume(s, i, '[')) return false;
  out.clear();
  i = skipWs(s, i);
  if (consume(s, i, ']')) return true;
  while (i < (int)s.size()) {
    int v = 0;
    if (!parseNumber(s, i, v)) return false;
    out.push_back(v);
    i = skipWs(s, i);
    if (consume(s, i, ']')) return true;
    if (!consume(s, i, ',')) return false;
  }
  return false;
}

static bool parseInput(const std::string& s, Input& in) {
  int i = 0;
  if (!consume(s, i, '{')) return false;
  bool gotFrames = false, gotRef = false;
  while (true) {
    i = skipWs(s, i);
    if (consume(s, i, '}')) break;
    std::string key;
    if (!parseString(s, i, key)) return false;
    if (!consume(s, i, ':')) return false;
    if (key == "frames") {
      int v = 0;
      if (!parseNumber(s, i, v)) return false;
      in.frames = v;
      gotFrames = true;
    } else if (key == "algorithm") {
      std::string v;
      if (!parseString(s, i, v)) return false;
      in.algorithm = v;
    } else if (key == "reference") {
      std::vector<int> arr;
      if (!parseIntArray(s, i, arr)) return false;
      in.reference = arr;
      gotRef = true;
    } else {
      // Skip unknown value (string, number, array of numbers, or object via naive brace counting).
      i = skipWs(s, i);
      if (i >= (int)s.size()) return false;
      if (s[i] == '"') {
        std::string tmp;
        if (!parseString(s, i, tmp)) return false;
      } else if (s[i] == '[') {
        std::vector<int> tmp;
        if (!parseIntArray(s, i, tmp)) return false;
      } else if (s[i] == '{') {
        int depth = 0;
        while (i < (int)s.size()) {
          if (s[i] == '{') depth++;
          else if (s[i] == '}') {
            depth--;
            if (depth == 0) {
              i++;
              break;
            }
          }
          i++;
        }
      } else {
        int tmp = 0;
        if (!parseNumber(s, i, tmp) && !consumeLiteral(s, i, "true") &&
            !consumeLiteral(s, i, "false") && !consumeLiteral(s, i, "null"))
          return false;
      }
    }
    i = skipWs(s, i);
    if (consume(s, i, '}')) break;
    if (!consume(s, i, ',')) return false;
  }
  return gotFrames && gotRef;
}

struct Step {
  int index = 0;
  int page = -1;
  std::vector<int> frames;
  bool fault = false;
  int replacedIndex = -1;
  int evicted = -1;
  bool hasEvicted = false;
};

static bool contains(const std::vector<int>& frames, int page, int& at) {
  for (int i = 0; i < (int)frames.size(); i++) {
    if (frames[i] == page) {
      at = i;
      return true;
    }
  }
  at = -1;
  return false;
}

static int firstEmpty(const std::vector<int>& frames) {
  for (int i = 0; i < (int)frames.size(); i++) {
    if (frames[i] == -1) return i;
  }
  return -1;
}

static std::vector<Step> simulateFIFO(int frameCount, const std::vector<int>& ref) {
  std::vector<int> frames(frameCount, -1);
  std::vector<int> order; // frame indices in insertion order
  std::vector<Step> steps;
  steps.reserve(ref.size());

  for (int t = 0; t < (int)ref.size(); t++) {
    int page = ref[t];
    Step s;
    s.index = t;
    s.page = page;

    int hitAt = -1;
    if (contains(frames, page, hitAt)) {
      s.fault = false;
      s.frames = frames;
      steps.push_back(s);
      continue;
    }

    s.fault = true;
    int emptyAt = firstEmpty(frames);
    if (emptyAt != -1) {
      frames[emptyAt] = page;
      order.push_back(emptyAt);
      s.replacedIndex = emptyAt;
      s.hasEvicted = false;
    } else {
      int victimFrame = order.front();
      order.erase(order.begin());
      s.replacedIndex = victimFrame;
      s.evicted = frames[victimFrame];
      s.hasEvicted = true;
      frames[victimFrame] = page;
      order.push_back(victimFrame);
    }

    s.frames = frames;
    steps.push_back(s);
  }

  return steps;
}

static std::vector<Step> simulateLRU(int frameCount, const std::vector<int>& ref) {
  std::vector<int> frames(frameCount, -1);
  std::vector<int> lastUsed(frameCount, -1);
  std::vector<Step> steps;
  steps.reserve(ref.size());

  for (int t = 0; t < (int)ref.size(); t++) {
    int page = ref[t];
    Step s;
    s.index = t;
    s.page = page;

    int hitAt = -1;
    if (contains(frames, page, hitAt)) {
      s.fault = false;
      lastUsed[hitAt] = t;
      s.frames = frames;
      steps.push_back(s);
      continue;
    }

    s.fault = true;
    int emptyAt = firstEmpty(frames);
    int victim = emptyAt;
    if (victim == -1) {
      victim = 0;
      for (int i = 1; i < frameCount; i++) {
        if (lastUsed[i] < lastUsed[victim]) victim = i;
      }
      s.evicted = frames[victim];
      s.hasEvicted = true;
    } else {
      s.hasEvicted = false;
    }

    frames[victim] = page;
    lastUsed[victim] = t;
    s.replacedIndex = victim;
    s.frames = frames;
    steps.push_back(s);
  }

  return steps;
}

static int nextUseIndex(const std::vector<int>& ref, int start, int page) {
  for (int i = start; i < (int)ref.size(); i++) {
    if (ref[i] == page) return i;
  }
  return -1;
}

static std::vector<Step> simulateOptimal(int frameCount, const std::vector<int>& ref) {
  std::vector<int> frames(frameCount, -1);
  std::vector<Step> steps;
  steps.reserve(ref.size());

  for (int t = 0; t < (int)ref.size(); t++) {
    int page = ref[t];
    Step s;
    s.index = t;
    s.page = page;

    int hitAt = -1;
    if (contains(frames, page, hitAt)) {
      s.fault = false;
      s.frames = frames;
      steps.push_back(s);
      continue;
    }

    s.fault = true;
    int emptyAt = firstEmpty(frames);
    int victim = emptyAt;
    if (victim == -1) {
      int bestIdx = -1;
      int bestNext = -1;
      for (int i = 0; i < frameCount; i++) {
        int p = frames[i];
        int n = nextUseIndex(ref, t + 1, p);
        if (n == -1) {
          victim = i;
          bestIdx = i;
          bestNext = std::numeric_limits<int>::max();
          break;
        }
        if (n > bestNext) {
          bestNext = n;
          bestIdx = i;
        }
      }
      victim = bestIdx;
      s.evicted = frames[victim];
      s.hasEvicted = true;
    } else {
      s.hasEvicted = false;
    }

    frames[victim] = page;
    s.replacedIndex = victim;
    s.frames = frames;
    steps.push_back(s);
  }

  return steps;
}

static void printIntArray(const std::vector<int>& arr) {
  std::cout << "[";
  for (int i = 0; i < (int)arr.size(); i++) {
    if (i) std::cout << ",";
    std::cout << arr[i];
  }
  std::cout << "]";
}

static void printStepsJson(const std::string& algorithm, int frameCount,
                           const std::vector<int>& ref, const std::vector<Step>& steps) {
  int faults = 0;
  int hits = 0;
  for (const auto& s : steps) {
    if (s.fault) faults++;
    else hits++;
  }

  std::cout << "{";
  std::cout << "\"ok\":true";
  std::cout << ",\"algorithm\":\"" << algorithm << "\"";
  std::cout << ",\"frames\":" << frameCount;
  std::cout << ",\"reference\":";
  printIntArray(ref);
  std::cout << ",\"summary\":{\"faults\":" << faults << ",\"hits\":" << hits << "}";
  std::cout << ",\"steps\":[";

  for (int i = 0; i < (int)steps.size(); i++) {
    const auto& s = steps[i];
    if (i) std::cout << ",";
    std::cout << "{";
    std::cout << "\"index\":" << s.index;
    std::cout << ",\"page\":" << s.page;
    std::cout << ",\"frames\":";
    printIntArray(s.frames);
    std::cout << ",\"fault\":" << (s.fault ? "true" : "false");
    if (s.replacedIndex >= 0) std::cout << ",\"replacedIndex\":" << s.replacedIndex;
    else std::cout << ",\"replacedIndex\":null";
    if (s.hasEvicted) std::cout << ",\"evicted\":" << s.evicted;
    else std::cout << ",\"evicted\":null";
    std::cout << "}";
  }

  std::cout << "]}";
}

static int faultsOnly(const std::vector<Step>& steps) {
  int faults = 0;
  for (const auto& s : steps) if (s.fault) faults++;
  return faults;
}

int main(int argc, char** argv) {
  if (argc < 2) {
    jsonFail("Expected command: simulate|compare");
    return 2;
  }
  std::string cmd = argv[1];
  std::string inputRaw = readAllStdin();

  Input in;
  if (!parseInput(inputRaw, in)) {
    jsonFail("Invalid input JSON. Expected {frames:number, reference:number[], algorithm?:string}");
    return 3;
  }
  if (in.frames < 1 || in.frames > 12) {
    jsonFail("frames must be in range 1..12");
    return 4;
  }
  if (in.reference.empty()) {
    jsonFail("reference must be non-empty");
    return 5;
  }

  if (cmd == "simulate") {
    std::string algo = in.algorithm;
    for (char& c : algo) c = (char)std::tolower((unsigned char)c);
    std::vector<Step> steps;
    if (algo == "fifo") steps = simulateFIFO(in.frames, in.reference);
    else if (algo == "lru") steps = simulateLRU(in.frames, in.reference);
    else if (algo == "optimal") steps = simulateOptimal(in.frames, in.reference);
    else {
      jsonFail("algorithm must be fifo|lru|optimal");
      return 6;
    }
    printStepsJson(algo, in.frames, in.reference, steps);
    std::cout << "\n";
    return 0;
  }

  if (cmd == "compare") {
    auto fifo = simulateFIFO(in.frames, in.reference);
    auto lru = simulateLRU(in.frames, in.reference);
    auto opt = simulateOptimal(in.frames, in.reference);

    std::cout << "{";
    std::cout << "\"ok\":true";
    std::cout << ",\"frames\":" << in.frames;
    std::cout << ",\"reference\":";
    printIntArray(in.reference);
    std::cout << ",\"fifo\":" << faultsOnly(fifo);
    std::cout << ",\"lru\":" << faultsOnly(lru);
    std::cout << ",\"optimal\":" << faultsOnly(opt);
    std::cout << "}\n";
    return 0;
  }

  jsonFail("Unknown command: " + cmd);
  return 2;
}
