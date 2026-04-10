const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pay-U SLA Tiers
interface TierConfig {
  dailyPremium: number;
  coverageCap: number;
  excessRate: number;
  displayName: string;
}

const INSURANCE_TIERS: Record<string, TierConfig> = {
  BASIC: {
    dailyPremium: 80,
    coverageCap: 8000,
    excessRate: 0.20,
    displayName: "Basic"
  },
  STANDARD: {
    dailyPremium: 150,
    coverageCap: 20000,
    excessRate: 0.15,
    displayName: "Standard"
  },
  PREMIUM: {
    dailyPremium: 250,
    coverageCap: 50000,
    excessRate: 0.10,
    displayName: "Premium"
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      dailyRentalAmount, 
      premiumPercentage, 
      numberOfDays,
      tier // New: specific tier key
    } = body ?? {};

    // Validate numberOfDays
    if (
      typeof numberOfDays !== "number" || 
      numberOfDays <= 0 || 
      !Number.isInteger(numberOfDays)
    ) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid numberOfDays. Must be a positive integer." 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let premiumPerDay = 0;
    let totalPremium = 0;
    let coverageCap = 0;
    let excessRate = 0;
    let selectedTier = tier?.toUpperCase();

    if (selectedTier && INSURANCE_TIERS[selectedTier]) {
      // Fixed Tier Logic (SLA)
      const tierConfig = INSURANCE_TIERS[selectedTier];
      premiumPerDay = tierConfig.dailyPremium;
      coverageCap = tierConfig.coverageCap;
      excessRate = tierConfig.excessRate;
    } else {
      // Fallback: Percentage-based (Legacy support)
      if (typeof dailyRentalAmount !== "number" || dailyRentalAmount <= 0) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid dailyRentalAmount. Must be a positive number." 
          }), 
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const rate = premiumPercentage ?? 0.15; // Default 15%
      premiumPerDay = dailyRentalAmount * rate;
      selectedTier = "CUSTOM";
    }

    totalPremium = premiumPerDay * numberOfDays;

    // Round to 2 decimal places (BWP currency)
    const result = {
      premiumPerDay: Math.round(premiumPerDay * 100) / 100,
      totalPremium: Math.round(totalPremium * 100) / 100,
      numberOfDays,
      tier: selectedTier,
      coverageCap,
      excessRate,
      // Metadata for split (SLA 90/10)
      remittance_payu: Math.round(totalPremium * 0.9 * 100) / 100,
      platform_commission: Math.round(totalPremium * 0.1 * 100) / 100
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ 
        error: e instanceof Error ? e.message : "Unknown error" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

