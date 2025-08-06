const Habit = require('../models/Habit');

/**
 * @desc    Get all habits for the logged-in user
 * @route   GET /api/habits
 * @access  Private
 */
exports.getHabits = async (req, res) => {
  try {
    // Find habits associated with the logged-in user
    const habits = await Habit.find({ user: req.user.id });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new habit for the logged-in user
 * @route   POST /api/habits
 * @access  Private
 */
exports.createHabit = async (req, res) => {
  const { name, description, color } = req.body;

  try {
    // Create a new habit document
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

/**
 * @desc    Update an existing habit (only if owned by user)
 * @route   PUT /api/habits/:id
 * @access  Private
 */
exports.updateHabit = async (req, res) => {
  try {
    // Find the habit to be updated
    let habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Ensure the habit belongs to the logged-in user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Update habit with new data, return updated version
    habit = await Habit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a habit (only if owned by user)
 * @route   DELETE /api/habits/:id
 * @access  Private
 */
exports.deleteHabit = async (req, res) => {
  try {
    // Find habit by ID
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Authorization check
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Safely delete habit
    await habit.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle habit completion for a specific date
 * @route   POST /api/habits/:id/toggle-completion
 * @access  Private
 */
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

    // Check if the date already exists in completions
    const dateIndex = habit.completions.findIndex(
      c => c.date.getTime() === completionDate.getTime()
    );

    if (dateIndex > -1) {
      // If already completed, remove it (toggle off)
      habit.completions.splice(dateIndex, 1);
    } else {
      // If not completed, add it (toggle on)
      habit.completions.push({ date: completionDate });
    }

    await habit.save();
    res.status(200).json(habit);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
