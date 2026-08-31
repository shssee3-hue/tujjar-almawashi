import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT_ID = "demo-tujjar";
const SELLER = "seller-uid";
const BUYER = "buyer-uid";
const OWNER = "owner-uid";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(
        fileURLToPath(new URL("../firestore.rules", import.meta.url)),
        "utf8"
      ),
    },
  });
});

afterAll(() => testEnv.cleanup());

// A minimal, rule-satisfying world: the three principals plus one live ad
// owned by SELLER with non-zero moderation counters (so "can't touch" tests
// have something to try to change).
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", SELLER), {
      name: "S",
      accountType: "trader",
      adsCount: 0,
      reportsCount: 0,
      role: "user",
      phoneNumber: "0500000000",
      email: "s@example.com",
      createdAt: 0,
    });
    await setDoc(doc(db, "users", BUYER), {
      name: "B",
      accountType: "individual",
      adsCount: 0,
      reportsCount: 0,
      role: "user",
      phoneNumber: "0511111111",
      email: "b@example.com",
      createdAt: 0,
    });
    await setDoc(doc(db, "users", OWNER), {
      name: "O",
      accountType: "individual",
      adsCount: 0,
      reportsCount: 0,
      role: "owner",
      phoneNumber: "0522222222",
      email: "o@example.com",
      createdAt: 0,
    });
    await setDoc(doc(db, "ads", "ad1"), {
      sellerId: SELLER,
      sellerName: "S",
      sellerType: "trader",
      category: "livestock",
      title: "نعجة",
      price: 100,
      status: "active",
      oathAccepted: true,
      reportsCount: 2,
      featured: false,
      createdAt: 0,
    });
  });
});

const asSeller = () => testEnv.authenticatedContext(SELLER).firestore();
const asBuyer = () => testEnv.authenticatedContext(BUYER).firestore();
const asOwner = () => testEnv.authenticatedContext(OWNER).firestore();
const asAnon = () => testEnv.unauthenticatedContext().firestore();

const validAd = (over: Record<string, unknown> = {}) => ({
  sellerId: SELLER,
  sellerName: "S",
  sellerType: "trader",
  category: "livestock",
  title: "خروف",
  price: 100,
  status: "active",
  oathAccepted: true,
  reportsCount: 0,
  createdAt: 0,
  ...over,
});

describe("ads: create", () => {
  it("accepts a well-formed ad from its seller", async () => {
    await assertSucceeds(setDoc(doc(asSeller(), "ads", "new1"), validAd()));
  });

  it("rejects a missing/false oath", async () => {
    await assertFails(
      setDoc(doc(asSeller(), "ads", "new2"), validAd({ oathAccepted: false }))
    );
  });

  it("rejects a seller impersonating another uid", async () => {
    await assertFails(
      setDoc(doc(asBuyer(), "ads", "new3"), validAd({ sellerId: SELLER }))
    );
  });

  it("rejects a pre-seeded reportsCount", async () => {
    await assertFails(
      setDoc(doc(asSeller(), "ads", "new5"), validAd({ reportsCount: 3 }))
    );
  });

  it("rejects a negative price and an unknown category", async () => {
    await assertFails(setDoc(doc(asSeller(), "ads", "new6"), validAd({ price: -1 })));
    await assertFails(
      setDoc(doc(asSeller(), "ads", "new7"), validAd({ category: "gold" }))
    );
  });

  it("rejects an ad that is already featured", async () => {
    await assertFails(
      setDoc(doc(asSeller(), "ads", "new8"), validAd({ featured: true }))
    );
  });
});

describe("ads: update", () => {
  it("lets the seller edit their own content", async () => {
    await assertSucceeds(updateDoc(doc(asSeller(), "ads", "ad1"), { title: "جديد" }));
  });

  it("blocks the seller from self-featuring or editing the report count", async () => {
    await assertFails(updateDoc(doc(asSeller(), "ads", "ad1"), { featured: true }));
    await assertFails(updateDoc(doc(asSeller(), "ads", "ad1"), { reportsCount: 0 }));
  });

  it("allows status -> ended/deleted but not a revert to active", async () => {
    await assertSucceeds(updateDoc(doc(asSeller(), "ads", "ad1"), { status: "ended" }));
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "ads", "ad1"), { status: "flagged" });
    });
    await assertFails(updateDoc(doc(asSeller(), "ads", "ad1"), { status: "active" }));
  });

  it("lets a signed-in user bump reportsCount by exactly one", async () => {
    await assertSucceeds(
      updateDoc(doc(asBuyer(), "ads", "ad1"), { reportsCount: 3 })
    );
    await assertFails(updateDoc(doc(asAnon(), "ads", "ad1"), { reportsCount: 3 }));
  });

  it("only the system owner may hard-delete", async () => {
    await assertFails(deleteDoc(doc(asSeller(), "ads", "ad1")));
    await assertSucceeds(deleteDoc(doc(asOwner(), "ads", "ad1")));
  });
});

describe("users", () => {
  it("create pins role=user and zeroed trust fields", async () => {
    const NEW = "fresh-uid";
    const base = {
      name: "N",
      accountType: "individual",
      adsCount: 0,
      reportsCount: 0,
      role: "user",
      phoneNumber: "0533333333",
      email: "n@example.com",
      createdAt: 0,
    };
    await assertSucceeds(
      setDoc(doc(testEnv.authenticatedContext(NEW).firestore(), "users", NEW), base)
    );
  });

  it("create rejects a self-assigned admin role or pre-seeded counters", async () => {
    const NEW = "fresh-uid-2";
    const db = testEnv.authenticatedContext(NEW).firestore();
    await assertFails(
      setDoc(doc(db, "users", NEW), {
        name: "N",
        accountType: "individual",
        adsCount: 0,
        reportsCount: 0,
        role: "admin",
        phoneNumber: "0",
        email: "n@e.com",
        createdAt: 0,
      })
    );
    await assertFails(
      setDoc(doc(db, "users", NEW), {
        name: "N",
        accountType: "individual",
        adsCount: 0,
        reportsCount: 3,
        role: "user",
        phoneNumber: "0",
        email: "n@e.com",
        createdAt: 0,
      })
    );
  });

  it("self-update cannot escalate role or ban", async () => {
    await assertSucceeds(
      updateDoc(doc(asBuyer(), "users", BUYER), { name: "B2" })
    );
    await assertFails(updateDoc(doc(asBuyer(), "users", BUYER), { role: "admin" }));
    await assertFails(updateDoc(doc(asBuyer(), "users", BUYER), { banned: true }));
  });

  it("a non-owner cannot read someone else's profile", async () => {
    await assertFails(getDoc(doc(asBuyer(), "users", SELLER)));
    await assertSucceeds(getDoc(doc(asOwner(), "users", SELLER)));
  });
});

describe("ratings (feature disabled)", () => {
  it("is entirely closed to direct client access", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "ratings", `ad1_${BUYER}`), {
        adId: "ad1",
        userId: BUYER,
        value: 4,
        createdAt: 0,
      });
    });
    await assertFails(getDoc(doc(asBuyer(), "ratings", `ad1_${BUYER}`)));
    await assertFails(
      setDoc(doc(asBuyer(), "ratings", `ad1_${BUYER}`), {
        adId: "ad1",
        userId: BUYER,
        value: 5,
        createdAt: 0,
      })
    );
  });
});

describe("commissions", () => {
  it("only the ad's seller may file, and only as pending", async () => {
    await assertSucceeds(
      addDoc(collection(asSeller(), "commissions"), {
        adId: "ad1",
        sellerId: SELLER,
        status: "pending",
        saleAmount: 100,
        createdAt: 0,
      })
    );
    await assertFails(
      addDoc(collection(asSeller(), "commissions"), {
        adId: "ad1",
        sellerId: SELLER,
        status: "approved",
        saleAmount: 100,
        createdAt: 0,
      })
    );
    await assertFails(
      addDoc(collection(asBuyer(), "commissions"), {
        adId: "ad1",
        sellerId: BUYER,
        status: "pending",
        saleAmount: 100,
        createdAt: 0,
      })
    );
  });

  it("only an admin may review, and only the review fields", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "commissions", "c1"), {
        adId: "ad1",
        sellerId: SELLER,
        status: "pending",
        saleAmount: 100,
        createdAt: 0,
      });
    });
    await assertFails(
      updateDoc(doc(asSeller(), "commissions", "c1"), { status: "approved" })
    );
    await assertSucceeds(
      updateDoc(doc(asOwner(), "commissions", "c1"), {
        status: "approved",
        reviewedAt: 1,
      })
    );
    await assertFails(
      updateDoc(doc(asOwner(), "commissions", "c1"), { saleAmount: 999 })
    );
  });
});

describe("counters/adCode", () => {
  it("create must start the sequence at 1 with no extra fields", async () => {
    await assertSucceeds(
      setDoc(doc(asSeller(), "counters", "adCode"), { year: 2026, seq: 1 })
    );
    await testEnv.clearFirestore();
    await assertFails(
      setDoc(doc(asSeller(), "counters", "adCode"), { year: 2026, seq: 4 })
    );
  });

  it("update may only step +1, or reset to 1 on a new year", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "counters", "adCode"), {
        year: 2026,
        seq: 5,
      });
    });
    await assertSucceeds(
      updateDoc(doc(asSeller(), "counters", "adCode"), { year: 2026, seq: 6 })
    );
    await assertFails(
      updateDoc(doc(asSeller(), "counters", "adCode"), { year: 2026, seq: 9 })
    );
    await assertSucceeds(
      updateDoc(doc(asSeller(), "counters", "adCode"), { year: 2027, seq: 1 })
    );
  });
});

describe("reports", () => {
  it("only an admin may read", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "reports", "rep1"), {
        adId: "ad1",
        reporterId: BUYER,
        reason: "x",
        status: "open",
        createdAt: 0,
      });
    });
    await assertFails(getDoc(doc(asBuyer(), "reports", "rep1")));
    await assertSucceeds(getDoc(doc(asOwner(), "reports", "rep1")));
  });

  it("a reporter must file under their own uid", async () => {
    await assertSucceeds(
      addDoc(collection(asBuyer(), "reports"), {
        adId: "ad1",
        reporterId: BUYER,
        reason: "مخالف",
        status: "open",
        createdAt: 0,
      })
    );
    await assertFails(
      addDoc(collection(asBuyer(), "reports"), {
        adId: "ad1",
        reporterId: SELLER,
        reason: "مخالف",
        status: "open",
        createdAt: 0,
      })
    );
  });
});

describe("password_resets", () => {
  it("is entirely closed to direct client access", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "password_resets", "r1"), {
        phone: "0500000000",
        uid: SELLER,
        used: false,
        verified: false,
        createdAt: 0,
        expiresAt: 0,
      });
    });
    await assertFails(getDoc(doc(asBuyer(), "password_resets", "r1")));
    await assertFails(
      setDoc(doc(asBuyer(), "password_resets", "r2"), { phone: "x" })
    );
  });
});

// Guards against an empty run silently passing in CI.
it("sanity: env wired up", () => {
  expect(testEnv).toBeTruthy();
});
