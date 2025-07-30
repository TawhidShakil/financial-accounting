import { useEffect, useState } from "react";


  useEffect(() => {
    const saved = localStorage.getItem("journalEntries");
    if (saved) {
      const parsed = JSON.parse(saved);


          account: item.account,
          type: item.type,
          amount: parseFloat(item.amount),
        }))
      );


          />
        </div>
      </div>


        </table>
      </div>
    </div>
  );
}
