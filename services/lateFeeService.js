/**
 * Late Fee Calculation Service (Late fees permanently removed from STACK QUEUE)
 * All late fees are locked to 0. No penalties or interest.
 */

function calculateInstallmentMetrics(installment, feePlan = null) {
  const principalAmount = installment.principalAmount || 0;
  const principalPaid = installment.principalPaid || 0;
  const principalPending = Math.max(0, principalAmount - principalPaid);

  if (principalPending <= 0) {
    return {
      isOverdue: false,
      overdueDays: 0,
      eligibleOverdueDays: 0,
      lateFeeAccrued: 0,
      principalPending: 0,
      lateFeePending: 0,
      status: 'Paid'
    };
  }

  return {
    isOverdue: false,
    overdueDays: 0,
    eligibleOverdueDays: 0,
    dailyLateFee: 0,
    lateFeeAccrued: 0,
    principalPending,
    lateFeePending: 0,
    status: principalPaid > 0 ? 'Partially Paid' : 'Pending'
  };
}

function allocatePayment({ paymentAmount, principalPending }) {
  const remainingPayment = Math.max(0, paymentAmount);
  const principalAllocated = Math.min(remainingPayment, principalPending);
  const excessCredit = Math.max(0, remainingPayment - principalAllocated);

  return {
    principalAllocated,
    lateFeeAllocated: 0,
    excessCredit
  };
}

module.exports = {
  calculateInstallmentMetrics,
  calculateInstallmentOverdueMetrics: calculateInstallmentMetrics,
  allocatePayment
};
