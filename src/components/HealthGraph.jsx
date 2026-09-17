"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HealthGraph() {
    const data = {
        labels: ["W1", "W2", "W3", "W4"],
        datasets: [
            {
                // Soft Light Orange Background Track Bar
                label: "Track",
                data: [100, 100, 100, 100],
                backgroundColor: "#FFF0E6",
                borderRadius: 16,
                borderSkipped: false,
                barThickness: 52,
                maxBarThickness: 58,
                grouped: false,
            },
            {
                // Health Progress Bar with Rich Orange Colors
                label: "Health Index",
                data: [24, 46, 68, 89],
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return "#FF5500";

                    // Create vertical gradient for highest bar
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, "#FF8833");
                    gradient.addColorStop(1, "#FF4400");

                    const colors = [
                        "#FFD4B8",
                        "#FFAA73",
                        "#FF8033",
                        gradient,
                    ];
                    return colors[context.dataIndex];
                },
                borderRadius: 16,
                borderSkipped: false,
                barThickness: 52,
                maxBarThickness: 58,
                grouped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: "easeOutQuart",
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: "#0F172A",
                titleFont: { size: 12, weight: "bold" },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        if (context.datasetIndex === 0) return null;
                        return `Health Index: ${context.parsed.y}%`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { display: false },
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 20,
                    color: "#94A3B8",
                    font: { size: 12, weight: "600" },
                    padding: 8,
                },
                grid: {
                    display: false,
                    drawBorder: false,
                },
            },
        },
    };

    return (
        <div className="w-full h-full">
            <Bar data={data} options={options} />
        </div>
    );
}
