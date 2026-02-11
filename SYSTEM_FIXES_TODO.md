# 🔧 Core System Issues & Fixes

## Issues Identified by User

### ❌ **Issue #1: Price Inconsistency**
**Problem:** Different prices shown for online payment vs pay at counter
**Status:** Need to verify - might be intentional (convenience fee) or bug

### ❌ **Issue #2: Mock Data Inefficiency**  
**Problem:** Mock data loading mechanism isn't efficient
**Current:** Duplicating data in multiple places (agent.ts + service-context.tsx)
**Fix:** Single source of truth

### ❌ **Issue #3: Admin Services Not Showing**
**Problem:** Services added via admin panel don't appear in chat options
**Cause:** Mismatch between service JSON structure and expected format
**Fix:** Ensure admin form creates services with correct structure

### ❌ **Issue #4: Incorrect Matching**
**Problem:** User asks for "cardiologist" but gets "general physician"
**Cause:** Category matching logic might be too loose or mock data categories don't match
**Fix:** Improve weighted scoring and ensure mock data has correct categories

### ❌ **Issue #5: Limited Options**
**Problem:** Not enough variety in bus/flight options
**Fix:** Add more diverse mock data with different routes, times, prices

### ❌ **Issue #6: Schedule Display**
**Problem:** Schedules not shown properly for buses/flights
**Fix:** Ensure response formatting includes schedule info

---

## Action Plan

### Priority 1: Fix Mock Data Structure ⚡
1. Expand MOCK_APPOINTMENT_OPTIONS with more specialties (Cardiologist, Dentist, Dermatologist, etc.)
2. Add more BUS_OPTIONS with different routes and times
3. Add more FLIGHT_OPTIONS with schedules
4. Ensure all have proper `category` field for matching

### Priority 2: Fix Price Consistency 💰
1. Check if price difference is intentional
2. If bug: Ensure same service has same price regardless of payment method
3. If intentional: Add convenience fee logic and display it clearly

### Priority 3: Fix Service Matching 🎯
1. Improve category matching in getOptionsByType()
2. Add fuzzy matching for common synonyms (e.g., "heart doctor" → "cardiologist")
3. Log matching scores for debugging

### Priority 4: Fix Admin Integration 🔧
1. Check admin service creation form
2. Ensure it creates services with correct structure (type, category, details, etc.)
3. Test admin-added service shows in chat

### Priority 5: Enhance Response Formatting 📋
1. Add schedule display for buses/flights in response messages
2. Show available times sorted chronologically
3. Display route information clearly

---

## Files to Modify

1. ✅ `lib/chat/mock-data.ts` - Expand with more diverse options
2. ✅ `lib/chat/agent.ts` - Improve matching logic
3. ⚠️ `components/admin/ServiceForm.tsx` - Fix service creation
4. ⚠️ `lib/services/service-context.tsx` - Ensure consistency
5. ⚠️ Price logic - TBD based on whether intentional or bug
