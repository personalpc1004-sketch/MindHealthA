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
import { HeartPulse, Activity, Brain, Flame, TrendingUp, PieChart, BarChart3 } from "lucide-react";

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

export default function HealthAnalyticsCharts() {
    const [timeframe, setTimeframe] = useState("30d");

    // User Health Index trajectory data by timeframe
    const healthTrendMap = {
        "7d": {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            scores: [78, 82, 80, 86, 89, 91, 94],
        },
        "30d": {
            labels: [
                "Sep 1", "Sep 3", "Sep 6", "Sep 9", "Sep 12", "Sep 15",
                "Sep 18", "Sep 21", "Sep 24", "Sep 27", "Sep 30"
            ],
            scores: [72, 75, 74, 80, 83, 85, 87, 89, 90, 92, 94],
        },
        "12m": {
            labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            scores: [65, 68, 70, 74, 78, 81, 84, 86, 88, 90, 92, 94],
        },
    };

    const currentTrend = healthTrendMap[timeframe];

    // 1. User Health Score Trajectory Line Chart
    const lineChartData = {
        labels: currentTrend.labels,
        datasets: [
            {
                label: "User Health Index Score",
                data: currentTrend.scores,
                borderColor: "#EA580C", // Vibrant Orange
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
                    label: (context) => ` Health Score: ${context.parsed.y}/100 Index`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
            y: {
                min: 50,
                max: 100,
                grid: { color: "#FFEDD5", drawBorder: false },
                ticks: { color: "#64748B", font: { size: 11, weight: "600" } },
            },
        },
    };

    // 2. Health Pillar Breakdown Donut Graph
    const doughnutData = {
        labels: ["Emotional Balance", "Stress Control", "Sleep & Energy", "Mindfulness Focus"],
        datasets: [
            {
                data: [38, 26, 20, 16],
                backgroundColor: [
                    "#EA580C", // Vibrant Orange
                    "#F97316", // Bright Orange
                    "#FB923C", // Soft Orange
                    "#FDBA74", // Light Orange
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
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.parsed}% strength`,
                },
            },
        },
    };

    // 3. Weekly Mindfulness & Health Activity Bar Graph
    const barChartData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
            {
                label: "Mindfulness Active Minutes",
                data: [35, 45, 30, 60, 50, 75, 45],
                backgroundColor: (context) => {
                    const colors = ["#FED7AA", "#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C", "#F97316"];
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
                    label: (context) => ` Activity: ${context.parsed.y} mins`,
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
            {/* Main Health Trajectory Line Graph */}
            <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-orange-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <HeartPulse className="h-5 w-5" />
                            </span>
                            <h2 className="text-lg font-bold text-slate-900">
                                Personal Health Index Trajectory
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Overall physical and mental health wellness score progression over time
                        </p>
                    </div>

                    {/* Timeframe Controls */}
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

            {/* Sub-Health Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Pillar Donut Graph */}
                <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-50">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <PieChart className="h-4 w-4" />
                            </span>
                            <h3 className="text-base font-bold text-slate-900">
                                Health Pillar Breakdown
                            </h3>
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                            4 Core Pillars
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                        <div className="relative h-48 w-48 shrink-0">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-extrabold text-slate-900">94%</span>
                                <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">Wellness</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-2.5">
                            {[
                                { label: "Emotional Balance", pct: "38%", score: "Excellent", color: "bg-orange-600" },
                                { label: "Stress Control", pct: "26%", score: "Optimal", color: "bg-orange-500" },
                                { label: "Sleep & Energy", pct: "20%", score: "Good", color: "bg-orange-400" },
                                { label: "Mindfulness Focus", pct: "16%", score: "High", color: "bg-orange-300" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/40 border border-orange-100/60 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${item.color}`} />
                                        <span className="font-semibold text-slate-800">{item.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-orange-700 mr-2">{item.pct}</span>
                                        <span className="text-[10px] text-slate-400">({item.score})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Weekly Activity Bar Graph */}
                <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-50">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <BarChart3 className="h-4 w-4" />
                            </span>
                            <h3 className="text-base font-bold text-slate-900">
                                Daily Mindfulness & Activity
                            </h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            Active Minutes / Day
                        </span>
                    </div>

                    <div className="h-52 w-full pt-2">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>

                    <p className="text-[11px] text-slate-500 text-center mt-3 pt-2 border-t border-orange-50">
                        🔥 Best engagement achieved on <strong className="text-orange-600 font-semibold">Saturday (75 mins)</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}
