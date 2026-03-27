import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

ChartJS.defaults.font.family = '"Space Grotesk", "Segoe UI", sans-serif';
ChartJS.defaults.color = "#64748b";
