import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Calculate insurance premium using rental-amount-based formula
 * Formula: Premium = Daily Rental Rate × Premium Percentage × Number of Days
 * 
 * Expected input:
 * {
 *   dailyRentalAmount: number,  // e.g., 500 (BWP per day)
 *   premiumPercentage: number,  // e.g., 0.25 (25%), 0.50 (50%), 1.00 (100%)
 *   numberOfDays: number        // e.g., 7
 * }
 * 
 * Returns:
 * {
 *   premiumPerDay: number,  // dailyRentalAmount × premiumPercentage
 *   totalPremium: number,    // premiumPerDay × numberOfDays
 *   numberOfDays: number
 * }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { dailyRentalAmount, premiumPercentage, numberOfDays } = body ?? {};

    // Validate inputs
    if (
      typeof dailyRentalAmount !== "number" || 
      dailyRentalAmount <= 0
    ) {
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

    if (
      typeof premiumPercentage !== "number" || 
      premiumPercentage < 0 || 
      premiumPercentage > 1
    ) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid premiumPercentage. Must be between 0 and 1 (e.g., 0.25 for 25%)." 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Calculate premium using rental-based formula
    const premiumPerDay = dailyRentalAmount * premiumPercentage;
    const totalPremium = premiumPerDay * numberOfDays;

    // Round to 2 decimal places (BWP currency)
    const result = {
      premiumPerDay: Math.round(premiumPerDay * 100) / 100,
      totalPremium: Math.round(totalPremium * 100) / 100,
      numberOfDays,
      dailyRentalAmount,
      premiumPercentage,
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
