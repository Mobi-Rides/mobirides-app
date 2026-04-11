const fs = require('fs');

function fixWithdrawal() {
  let file = 'src/components/admin/finance/WithdrawalRequestsTable.tsx';
  let b = fs.readFileSync(file, 'utf8');
  b = b.replace('return (\n    <div className="space-y-4">', 'return (\n    <>\n      <div className="space-y-4">');
  b = b.replace('return (\r\n    <div className="space-y-4">', 'return (\r\n    <>\r\n      <div className="space-y-4">');
  b = b.replace('    </div>\r\n    <PayoutDetailsDialog', '    </div>\r\n      <PayoutDetailsDialog');
  b = b.replace('    </div>\n    <PayoutDetailsDialog', '    </div>\n      <PayoutDetailsDialog');
  b = b.replace('<PayoutDetailsDialog withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />\r\n  );', '<PayoutDetailsDialog withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />\r\n    </>\r\n  );');
  b = b.replace('<PayoutDetailsDialog withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />\n  );', '<PayoutDetailsDialog withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />\n    </>\n  );');
  fs.writeFileSync(file, b);
}

function fixInsurance() {
  let file = 'src/components/admin/finance/InsuranceRemittanceTable.tsx';
  let b = fs.readFileSync(file, 'utf8');
  b = b.replace('return (\n    <div className="space-y-4">', 'return (\n    <>\n      <div className="space-y-4">');
  b = b.replace('return (\r\n    <div className="space-y-4">', 'return (\r\n    <>\r\n      <div className="space-y-4">');
  b = b.replace('    </div>\r\n    <InsuranceCoverageDialog', '    </div>\r\n      <InsuranceCoverageDialog');
  b = b.replace('    </div>\n    <InsuranceCoverageDialog', '    </div>\n      <InsuranceCoverageDialog');
  b = b.replace('<InsuranceCoverageDialog policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />\r\n  );', '<InsuranceCoverageDialog policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />\r\n    </>\r\n  );');
  b = b.replace('<InsuranceCoverageDialog policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />\n  );', '<InsuranceCoverageDialog policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />\n    </>\n  );');
  fs.writeFileSync(file, b);
}

fixWithdrawal();
fixInsurance();
