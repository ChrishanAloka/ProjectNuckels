// src/controllers/ActivityItemsMarkProgressController.js
const Level4Activity = require('../models/Level4Activity');
const Level5ActivityItem = require('../models/Level5ActivityItem');
const ActivityItemsMarkProgress = require('../models/ActivityItemsMarkProgress');

// Helper: Get current total progress for an item
const getCurrentProgress = async (itemId) => {
  const progressEntries = await ActivityItemsMarkProgress.find({ activityItem: itemId }).lean();
  const totalPhysical = progressEntries.reduce((sum, p) => sum + (p.physicalProgressPercentage || 0), 0);
  const totalFinancial = progressEntries.reduce((sum, p) => sum + (p.financialProgressPercentage || 0), 0);
  return { totalPhysical, totalFinancial, count: progressEntries.length };
};

// POST /api/auth/activityitemsmarkprogress
exports.markProgress = async (req, res) => {
  const {
    activityItem,
    fromDate,
    toDate,
    physicalProgressDescription,
    physicalProgressPercentage,
    financialProgressAmount,
    financialProgressPercentage
  } = req.body;

  // Validation
  if (!activityItem || !fromDate || !toDate || physicalProgressPercentage == null || financialProgressPercentage == null || financialProgressAmount == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const physicalPct = Number(physicalProgressPercentage);
  const financialPct = Number(financialProgressPercentage);
  const financialAmt = Number(financialProgressAmount);

  if (isNaN(physicalPct) || physicalPct <= 0 || physicalPct > 100) {
    return res.status(400).json({ error: 'Physical progress must be between 0 and 100' });
  }
  if (isNaN(financialPct) || financialPct <= 0 || financialPct > 100) {
    return res.status(400).json({ error: 'Financial progress % must be between 0 and 100' });
  }
  if (isNaN(financialAmt) || financialAmt < 0) {
    return res.status(400).json({ error: 'Financial amount must be a non-negative number' });
  }

  if (new Date(toDate) < new Date(fromDate)) {
    return res.status(400).json({ error: 'To date must be after or equal to from date' });
  }

  try {
    // Step 1: Fetch the Level 5 item
    const item = await Level5ActivityItem.findById(activityItem).populate('parentItem', '_id parentItem');
    if (!item) {
      return res.status(404).json({ error: 'Level 5 activity item not found' });
    }

    // Step 2: Extract Level 4 and Level 3
    const level4Activity = item.parentItem; // This is a Level4Activity object
    if (!level4Activity) {
      return res.status(404).json({ error: 'Level 4 parent not found for this item' });
    }

    // Level 4's parent is Level 3 (stored as `parentItem` in Level4Activity model)
    const level4Populated = await Level4Activity.findById(level4Activity._id).populate('parentItem', '_id');
    const level3Component = level4Populated?.parentItem;
    if (!level3Component) {
      return res.status(404).json({ error: 'Level 3 grandparent not found' });
    }

    // Step 3: Validate financial amount against Level 5 item's budget
    if (financialAmt > item.estimatedAmount) {
      return res.status(400).json({
        error: `Financial amount ($${financialAmt}) exceeds item's total budget ($${item.estimatedAmount})`
      });
    }

    // Step 4: Check cumulative progress for this Level 5 item
    const existingEntries = await ActivityItemsMarkProgress.find({ activityItem }).lean();
    const totalPhysical = existingEntries.reduce((sum, p) => sum + (p.physicalProgressPercentage || 0), 0);
    const totalFinancial = existingEntries.reduce((sum, p) => sum + (p.financialProgressPercentage || 0), 0);

    if (totalPhysical + physicalPct > 100) {
      return res.status(400).json({
        error: `Physical progress would exceed 100%. Current: ${totalPhysical}%, Adding: ${physicalPct}%`
      });
    }
    if (totalFinancial + financialPct > 100) {
      return res.status(400).json({
        error: `Financial progress would exceed 100%. Current: ${totalFinancial}%, Adding: ${financialPct}%`
      });
    }

    // Step 5: Create progress record with full hierarchy
    const newProgress = new ActivityItemsMarkProgress({
      activityItem: item._id,
      level4Activity: level4Activity._id,
      level3Component: level3Component._id,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      physicalProgressDescription: physicalProgressDescription || "",
      physicalProgressPercentage: physicalPct,
      financialProgressAmount: financialAmt,
      financialProgressPercentage: financialPct
    });

    const saved = await newProgress.save();

    // Populate all references for response
    const populated = await saved
      .populate('activityItem', 'code itemName estimatedAmount')
      .populate('level4Activity', 'code activityName')
      .populate('level3Component', 'code componentName');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Failed to mark progress:', err.message);
    res.status(500).json({ error: 'Failed to record progress' });
  }
};

// GET /api/auth/activityitemsmarkprogress/by-item/:itemId
exports.getProgressByItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const progressEntries = await ActivityItemsMarkProgress.find({ activityItem: itemId })
        .populate('activityItem', 'code itemName')
        .populate('level4Activity', 'code activityName')
        .populate('level3Component', 'code componentName')
        .sort({ fromDate: 1 });

    // Also return current totals
    const { totalPhysical, totalFinancial } = await getCurrentProgress(itemId);

    res.json({
      entries: progressEntries,
      summary: {
        totalPhysicalProgress: parseFloat(totalPhysical.toFixed(2)),
        totalFinancialProgress: parseFloat(totalFinancial.toFixed(2)),
        completed: totalPhysical >= 100 && totalFinancial >= 100
      }
    });
  } catch (err) {
    console.error('Failed to load progress:', err.message);
    res.status(500).json({ error: 'Failed to load progress data' });
  }
};

// GET /api/auth/activityitemsmarkprogress — all (optional, for admin)
exports.getAllProgress = async (req, res) => {
  try {
    const all = await ActivityItemsMarkProgress.find()
        .populate('activityItem', 'code itemName')
        .populate('level4Activity', 'code activityName')
        .populate('level3Component', 'code componentName')
        .sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load progress records' });
  }
};