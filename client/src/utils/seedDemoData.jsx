
export function seedDemoData() {
    try {
        const SEED_KEY = "demoSeed_v1";
        if (localStorage.getItem(SEED_KEY)) return;

        // --- COA merge/update ---
        const coaKey = "chartOfAccounts";
        const existingCOA = JSON.parse(localStorage.getItem(coaKey) || "{}");
        const add = (name, category) => {
            const norm = (category || "").toLowerCase();
            existingCOA[name] = {
                ...(existingCOA[name] || {}),
                category:
                    norm.startsWith("asset") ? "asset" :
                        norm.startsWith("liab") ? "liability" :
                            norm.startsWith("equity") || norm.startsWith("capital") || norm.includes("owner") ? "equity" :
                                norm.startsWith("rev") ? "revenue" :
                                    norm.startsWith("exp") ? "expense" : norm
            };
        };

        // Core accounts (assets)
        add("Cash", "Asset");
        add("Accounts Receivable", "Asset");
        add("Equipment", "Asset");
        add("Prepaid Insurance", "Asset");

        // Liabilities
        add("Bank Loan Payable", "Liability");
        add("Salaries Payable", "Liability");

        // Equity
        add("Owner’s Equity", "Equity");

        // Revenues
        add("Service Revenue", "Revenue");

        // Expenses
        add("Rent Expense", "Expense");
        add("Salaries Expense", "Expense");
        add("Interest Expense", "Expense");
        add("Utilities Expense", "Expense");

        localStorage.setItem(coaKey, JSON.stringify(existingCOA));

        // --- Helper: ISO date strings in current month ---
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0"); // current month
        const d = (day) => `${yyyy}-${mm}-${String(day).padStart(2, "0")}`;

        // --- 10 demo journals (new format with entries[]) ---
        const demoJournals = [
            // 1) Owner invests capital
            {
                id: "J1",
                date: d(1),
                description: "Owner investment",
                entries: [
                    { account: "Cash", type: "Debit", amount: 50000 },
                    { account: "Owner’s Equity", type: "Credit", amount: 50000 },
                ],
            },
            // 2) Buy equipment (part cash, part loan)
            {
                id: "J2",
                date: d(2),
                description: "Purchase equipment (cash + loan)",
                entries: [
                    { account: "Equipment", type: "Debit", amount: 20000 },
                    { account: "Cash", type: "Credit", amount: 8000 },
                    { account: "Bank Loan Payable", type: "Credit", amount: 12000 },
                ],
            },
            // 3) Prepaid insurance
            {
                id: "J3",
                date: d(3),
                description: "Prepaid insurance",
                entries: [
                    { account: "Prepaid Insurance", type: "Debit", amount: 2400 },
                    { account: "Cash", type: "Credit", amount: 2400 },
                ],
            },
            // 4) Service revenue (cash)
            {
                id: "J4",
                date: d(5),
                description: "Service revenue (cash)",
                entries: [
                    { account: "Cash", type: "Debit", amount: 5000 },
                    { account: "Service Revenue", type: "Credit", amount: 5000 },
                ],
            },
            // 5) Service revenue (on account)
            {
                id: "J5",
                date: d(7),
                description: "Service revenue (on account)",
                entries: [
                    { account: "Accounts Receivable", type: "Debit", amount: 7000 },
                    { account: "Service Revenue", type: "Credit", amount: 7000 },
                ],
            },
            // 6) Rent paid
            {
                id: "J6",
                date: d(8),
                description: "Rent for office",
                entries: [
                    { account: "Rent Expense", type: "Debit", amount: 2000 },
                    { account: "Cash", type: "Credit", amount: 2000 },
                ],
            },
            // 7) Salaries accrued (payable)
            {
                id: "J7",
                date: d(10),
                description: "Accrue salaries",
                entries: [
                    { account: "Salaries Expense", type: "Debit", amount: 3000 },
                    { account: "Salaries Payable", type: "Credit", amount: 3000 },
                ],
            },
            // 8) Receive from customer (A/R collection)
            {
                id: "J8",
                date: d(12),
                description: "A/R collection",
                entries: [
                    { account: "Cash", type: "Debit", amount: 4000 },
                    { account: "Accounts Receivable", type: "Credit", amount: 4000 },
                ],
            },
            // 9) Loan repayment with interest
            {
                id: "J9",
                date: d(15),
                description: "Loan repayment with interest",
                entries: [
                    { account: "Bank Loan Payable", type: "Debit", amount: 1000 }, // principal
                    { account: "Interest Expense", type: "Debit", amount: 200 },   // interest
                    { account: "Cash", type: "Credit", amount: 1200 },
                ],
            },
            // 10) Utilities paid
            {
                id: "J10",
                date: d(18),
                description: "Utilities paid",
                entries: [
                    { account: "Utilities Expense", type: "Debit", amount: 1100 },
                    { account: "Cash", type: "Credit", amount: 1100 },
                ],
            },
            {
                id: "J11",
                date: d(20),
                description: "Additional owner investment",
                entries: [
                    { account: "Cash", type: "Debit", amount: 15000 },
                    { account: "Owner’s Equity", type: "Credit", amount: 15000 },
                ],
            },
            // 12) Purchase office supplies (cash)
            {
                id: "J12",
                date: d(21),
                description: "Office supplies purchase",
                entries: [
                    { account: "Office Supplies", type: "Debit", amount: 1200 },
                    { account: "Cash", type: "Credit", amount: 1200 },
                ],
            },
            // 13) Advertising expense paid
            {
                id: "J13",
                date: d(21),
                description: "Advertising expense",
                entries: [
                    { account: "Advertising Expense", type: "Debit", amount: 2500 },
                    { account: "Cash", type: "Credit", amount: 2500 },
                ],
            },
            // 14) Service revenue (mixed payment: half cash, half on account)
            {
                id: "J14",
                date: d(22),
                description: "Service revenue mixed payment",
                entries: [
                    { account: "Cash", type: "Debit", amount: 3000 },
                    { account: "Accounts Receivable", type: "Debit", amount: 3000 },
                    { account: "Service Revenue", type: "Credit", amount: 6000 },
                ],
            },
            // 15) Utilities payable accrued
            {
                id: "J15",
                date: d(23),
                description: "Utilities payable accrued",
                entries: [
                    { account: "Utilities Expense", type: "Debit", amount: 900 },
                    { account: "Accounts Payable", type: "Credit", amount: 900 },
                ],
            },
            // 16) Pay accounts payable
            {
                id: "J16",
                date: d(24),
                description: "Pay accounts payable",
                entries: [
                    { account: "Accounts Payable", type: "Debit", amount: 900 },
                    { account: "Cash", type: "Credit", amount: 900 },
                ],
            },
            // 17) Rent income received
            {
                id: "J17",
                date: d(25),
                description: "Rent income",
                entries: [
                    { account: "Cash", type: "Debit", amount: 4000 },
                    { account: "Rent Income", type: "Credit", amount: 4000 },
                ],
            },
            // 18) Dividend income received
            {
                id: "J18",
                date: d(25),
                description: "Dividend income",
                entries: [
                    { account: "Cash", type: "Debit", amount: 2000 },
                    { account: "Dividend Income", type: "Credit", amount: 2000 },
                ],
            },
            // 19) Equipment repair expense paid
            {
                id: "J19",
                date: d(26),
                description: "Equipment repair expense",
                entries: [
                    { account: "Repairs Expense", type: "Debit", amount: 1800 },
                    { account: "Cash", type: "Credit", amount: 1800 },
                ],
            },
            // 20) Loan received from bank
            {
                id: "J20",
                date: d(27),
                description: "Loan from bank",
                entries: [
                    { account: "Cash", type: "Debit", amount: 10000 },
                    { account: "Bank Loan Payable", type: "Credit", amount: 10000 },
                ],
            },
        ];

        // Attach normalized category on each line (your JournalForm also does this from COA)
        const withCategories = demoJournals.map(j => ({
            ...j,
            entries: j.entries.map(e => ({
                ...e,
                category: (existingCOA[e.account]?.category) || "", // reports' normalizer will handle fallback
                source: "journal",
            })),
        }));

        // Merge to existing journalEntries (avoid duplicate by id)
        const jKey = "journalEntries";
        const existingJ = JSON.parse(localStorage.getItem(jKey) || "[]");
        const existingIds = new Set(existingJ.map(x => x.id).filter(Boolean));

        const merged = [
            ...existingJ,
            ...withCategories.filter(x => !existingIds.has(x.id)),
        ];

        localStorage.setItem(jKey, JSON.stringify(merged));

        // Optional: ensure ledgerEntries exists (your reports also read from journalEntries)
        if (!localStorage.getItem("ledgerEntries")) {
            localStorage.setItem("ledgerEntries", "[]");
        }

        // Mark as seeded
        localStorage.setItem(SEED_KEY, JSON.stringify({ at: new Date().toISOString() }));

        // Done
        // console.log("Demo journals seeded ");
    } catch (err) {
        console.error("Seeding failed:", err);
    }
}
