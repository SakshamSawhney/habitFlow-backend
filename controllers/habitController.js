const Habit = require('../models/Habit');

// @desc    Get all habits for a user
// @route   GET /api/habits
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
exports.createHabit = async (req, res) => {
  const { name, description, color } = req.body;
  try {
    const habit = await Habit.create({
      name,
      description,
      color,
      user: req.user.id,
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
exports.updateHabit = async (req, res) => {
    try {
        let habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        // Check if user owns the habit
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        habit = await Habit.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json(habit);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
exports.deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        // CORRECTED: Use .deleteOne() instead of the deprecated .remove()
        await habit.deleteOne(); 
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add or remove a completion for a habit on a specific date
// @route   POST /api/habits/:id/toggle-completion
exports.toggleCompletion = async (req, res) => {
    const { date } = req.body;
    
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const completionDate = new Date(date);
        const dateIndex = habit.completions.findIndex(c => c.date.getTime() === completionDate.getTime());

        if (dateIndex > -1) {
            habit.completions.splice(dateIndex, 1);
        } else {
            habit.completions.push({ date: completionDate });
        }

        await habit.save();
        res.status(200).json(habit);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};