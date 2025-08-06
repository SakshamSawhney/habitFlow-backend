const Habit = require('../models/Habit');
const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, eachDayOfInterval, format } = require('date-fns');

// @desc    Get all analytics data for a user
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const habits = await Habit.find({ user: req.user.id });

        // --- Calculate Top-Level Stats ---
        // --- completion---
        const totalCompletions = habits.reduce((acc, habit) => acc + habit.completions.length, 0);
        const completionsToday = habits.reduce((acc, habit) => {
            const todayCompletions = habit.completions.filter(c => 
                c.date >= startOfDay(new Date()) && c.date <= endOfDay(new Date())
            ).length;
            return acc + todayCompletions;
        }, 0);

        let bestStreak = 0;
        let totalStreakSum = 0;
        habits.forEach(habit => {
            const streak = habit.completions.length; // Simplified streak
            if (streak > bestStreak) {
                bestStreak = streak;
            }
            totalStreakSum += streak;
        });
        const averageStreak = habits.length > 0 ? Math.round(totalStreakSum / habits.length) : 0;

        // --- Calculate Chart Data ---
        // Daily Progress (Last 30 days)
        const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
        const dateInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
        const dailyProgress = dateInterval.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const completions = habits.reduce((acc, habit) => {
                return acc + habit.completions.filter(c => c.date >= dayStart && c.date <= dayEnd).length;
            }, 0);
            return { date: format(day, 'MMM dd'), completions };
        });

        // This Week's Progress
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekInterval = eachDayOfInterval({ start: weekStart, end: endOfWeek(new Date(), { weekStartsOn: 1 }) });
        const weeklyProgress = weekInterval.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const completions = habits.reduce((acc, habit) => {
                return acc + habit.completions.filter(c => c.date >= dayStart && c.date <= dayEnd).length;
            }, 0);
            return { day: format(day, 'E'), completions };
        });

        // Habit Streaks (Total completions per habit)
        const habitStreaks = habits.map(habit => ({
            name: habit.name,
            streak: habit.completions.length,
            fill: habit.color,
        }));

        // Habit Distribution (Pie Chart)
        const habitDistribution = habits.map(habit => ({
            name: habit.name,
            completions: habit.completions.length,
            fill: habit.color,
        })).filter(h => h.completions > 0);
        
        // Progress Summary
        const todaysCompletionRate = habits.length > 0 ? Math.round((completionsToday / habits.length) * 100) : 0;
        const habitsWith7DayStreak = habits.filter(h => h.completions.length >= 7).length;
        const habitsWith30DayStreak = habits.filter(h => h.completions.length >= 30).length;


        res.status(200).json({
            stats: {
                totalCompletions,
                averageStreak,
                bestStreak,
                completionsToday,
            },
            charts: {
                dailyProgress,
                weeklyProgress,
                habitStreaks,
                habitDistribution,
            },
            summary: {
                todaysCompletionRate,
                habitsWith7DayStreak,
                habitsWith30DayStreak,
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
