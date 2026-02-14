# ⚡ Quick Reference - 4 Steps to Launch

## Step 1: Database (2 min)
```
Supabase Dashboard → SQL Editor → Run supabase/migrations/001_mvp_complete.sql
```

## Step 2: Mock Data (3 min)
In `lib/chat/mock-data.ts`, add to each movie/bus/flight:
```typescript
venueId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Movies
venueId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Buses
venueId: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // Flights
```

## Step 3: Integrate (10 min)
In `app/chat/page.tsx`:

```typescript
import { BookingWizard } from '@/components/booking/BookingWizard';
import { needsWizard, getServiceType, generateSessionId } from '@/lib/booking/wizard-integration';

// Add state
const [wizardState, setWizardState] = useState(null);
const [sessionId] = useState(() => generateSessionId());

// Modify handleOptionSelect
if (needsWizard(option)) {
    setWizardState({
        active: true,
        service: option,
        serviceType: getServiceType(option)
    });
    return;
}

// Render wizard
{wizardState?.active && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <BookingWizard
            serviceType={wizardState.serviceType}
            selectedService={wizardState.service}
            sessionId={sessionId}
            onComplete={(id) => setWizardState(null)}
            onCancel={() => setWizardState(null)}
        />
    </div>
)}
```

## Step 4: Test (5 min)
```bash
npm run dev
```

Say "movie" → Click card → Wizard opens! ✅

---

## 📁 Files Created

26 new files in:
- `lib/booking/`
- `components/booking/`
- `app/api/seats/`
- `app/api/time-slots/`
- `supabase/migrations/`

## 🔑 Key Features

✅ Seat selection (cinema/bus/flight)
✅ Real-time updates
✅ 10-min timeout
✅ Multi-passenger
✅ Time slots (15-min)
✅ Race condition safe

## 🎯 Test Scenarios

1. **Movie:** Date → Time → Count → Seats → Pay
2. **Bus:** Date → Count → Names → Seats → Pay
3. **Appointment:** Date → Time Slot → Pay
4. **Real-time:** Two tabs, same seat → Only one wins

---

**Full docs:** `BUILD_COMPLETE.md`
