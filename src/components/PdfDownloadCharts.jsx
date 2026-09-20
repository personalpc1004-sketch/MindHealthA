"use client";

import React, { useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { TrendingUp, PieChart, BarChart3 } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function PdfDownloadCharts() {
    const [timeframe, setTimeframe] = useState("30d");

    // Data variations based on selected timeframe
    const trendDataMap = {
        "7d": {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            downloads: [45, 62, 58, 89, 120, 95, 142],
        },
        "30d": {
            labels: [
                "Sep 1", "Sep 3", "Sep 6", "Sep 9", "Sep 12", "Sep 15",
                "Sep 18", "Sep 21", "Sep 24", "Sep 27", "Sep 30"
            ],
            downloads: [320, 410, 390, 540, 680, 720, 810, 950, 1120, 1310, 1482],
        },
        "12m": {
            labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            downloads: [2100, 2800, 3400, 4200, 4900, 5800, 6500, 7800, 8900, 10200, 12400, 14820],
        },
    };

    const currentTrend = trendDataMap[timeframe];

    // 1. PDF Download Trend Line Chart Data
    const lineChartData = {
        labels: currentTrend.labels,
        datasets: [
            {
                label: "User PDF Downloads",
                data: currentTrend.downloads,
                borderColor: "#EA580C", // Orange-600
                borderWidth: 3,
                pointBackgroundColor: "#FFFFFF",
                pointBorderColor: "#EA580C",
                pointBorderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return "rgba(234, 88, 12, 0.1)";
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, "rgba(234, 88, 12, 0.35)");
                    gradient.addColorStop(0.8, "rgba(255, 237, 213, 0.05)");
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                    return gradient;
                },
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1E293B",
                titleColor: "#FFF7ED",
                bodyColor: "#FFEDD5",
                borderColor: "#EA580C",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (context) => ` Downloads: ${context.parsed.y.toLocaleString()} PDFs`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
            y: {
                grid: { color: "#FFEDD5", drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
        },
    };

    // 2. PDF Download Category Doughnut Data
    const doughnutData = {
        labels: ["Wellness Summaries", "Therapy Notes", "Scorecard Exports", "Weekly Activity Logs"],
        datasets: [
            {
                data: [42, 28, 18, 12],
                backgroundColor: [
                    "#EA580C", // Vibrant Orange
                    "#F97316", // Bright Orange
                    "#FB923C", // Soft Orange
                    "#FDBA74", // Light Orange
                ],
                hoverBackgroundColor: [
                    "#C2410C",
                    "#EA580C",
                    "#F97316",
                    "#FB923C",
                ],
                borderWidth: 3,
                borderColor: "#FFFFFF",
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1E293B",
                titleColor: "#FFF7ED",
                bodyColor: "#FFEDD5",
                borderColor: "#EA580C",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.parsed}% of total`,
                },
            },
        },
    };

    // 3. Peak Download Hours Bar Data
    const barChartData = {
        labels: ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
        datasets: [
            {
                label: "PDF Downloads by Hour",
                data: [140, 420, 680, 510, 890, 340],
                backgroundColor: (context) => {
                    const colors = ["#FED7AA", "#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C"];
                    return colors[context.dataIndex % colors.length];
                },
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1E293B",
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` Downloads: ${context.parsed.y} PDFs`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
            y: {
                grid: { color: "#FFEDD5", drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Main Download Trend Line Graph */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-orange-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <TrendingUp className="h-5 w-5" />
                            </span>
                            <h2 className="text-lg font-bold text-slate-900">
                                User PDF Download Trends
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Real-time trajectory of PDF export activity across all registered users
                        </p>
                    </div>

                    {/* Timeframe Filter Buttons */}
                    <div className="flex items-center bg-orange-50/80 p-1 rounded-xl border border-orange-100 self-start sm:self-auto">
                        {[
                            { id: "7d", label: "7 Days" },
                            { id: "30d", label: "30 Days" },
                            { id: "12m", label: "12 Months" },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setTimeframe(btn.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    timeframe === btn.id
                                        ? "bg-orange-500 text-white shadow-sm"
                                        : "text-slate-600 hover:text-orange-600 hover:bg-orange-100/50"
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-72 w-full">
                    <Line data={lineChartData} options={lineChartOptions} />
                </div>
            </div>

            {/* Sub-Analytics Grid: Category Breakdown & Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Donut Graph */}
                <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-50">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <PieChart className="h-4 w-4" />
                            </span>
                            <h3 className="text-base font-bold text-slate-900">
                                Download Breakdown by Category
                            </h3>
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                            4 Categories
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                        <div className="relative h-48 w-48 shrink-0">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-extrabold text-slate-900">1,482</span>
                                <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">PDFs</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-2.5">
                            {[
                                { label: "Wellness Summaries", pct: "42%", count: "622 downloads", color: "bg-orange-600" },
                                { label: "Therapy Notes", pct: "28%", count: "415 downloads", color: "bg-orange-500" },
                                { label: "Scorecard Exports", pct: "18%", count: "266 downloads", color: "bg-orange-400" },
                                { label: "Weekly Logs", pct: "12%", count: "179 downloads", color: "bg-orange-300" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/40 border border-orange-100/60 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${item.color}`} />
                                        <span className="font-semibold text-slate-800">{item.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-orange-700 mr-2">{item.pct}</span>
                                        <span className="text-[10px] text-slate-400">({item.count})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Peak Hours Bar Graph */}
                <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-50">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <BarChart3 className="h-4 w-4" />
                            </span>
                            <h3 className="text-base font-bold text-slate-900">
                                Peak Download Time Slots
                            </h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            Hourly Activity
                        </span>
                    </div>

                    <div className="h-52 w-full pt-2">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>

                    <p className="text-[11px] text-slate-500 text-center mt-3 pt-2 border-t border-orange-50">
                        🔥 Peak user PDF export window occurs between <strong className="text-orange-600 font-semibold">18:00 - 21:00</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}
