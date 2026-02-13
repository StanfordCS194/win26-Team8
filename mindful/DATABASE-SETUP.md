# Database Reset Instructions

## What Changed

We've simplified the database schema to match your UI perfectly:

### Old Schema (Complex)
- 4 separate text fields: `questionnaire_why`, `questionnaire_alternatives`, `questionnaire_impact`, `questionnaire_urgency`
- Had to map 5+ dynamic questions to 4 fixed fields
- Complex string concatenation and parsing

### New Schema (Simple)
- 1 JSONB field: `questionnaire`
- Stores dynamic array of questions: `[{id, question, answer}, ...]`
- No mapping needed - direct storage!

## Steps to Reset Database

### 1. Open Supabase Dashboard
Go to: https://mohgivduzthccoybnbnr.supabase.co

### 2. Navigate to SQL Editor
- Click "SQL Editor" in the left sidebar
- Click "New query"

### 3. Run the Reset Script
- Open the file: `database-reset.sql` in this folder
- Copy the entire contents
- Paste into the Supabase SQL editor
- Click "Run" or press Cmd/Ctrl + Enter

### 4. Verify the Table
After running the script, check:
- Go to "Table Editor" in left sidebar
- Click on "items" table
- You should see the new structure with a `questionnaire` JSONB column

### 5. Test Adding an Item
- Go back to your app
- Try adding a new item
- Check the console (F12) for detailed logs
- The item should now save successfully!

## What the New Schema Looks Like

```sql
CREATE TABLE public.items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  image_url TEXT,
  constraint_type TEXT NOT NULL,  -- 'time' or 'goals'
  consumption_score INTEGER NOT NULL,  -- 1-10
  wait_until_date DATE,
  difficulty TEXT,  -- 'easy', 'medium', 'hard'
  questionnaire JSONB NOT NULL,  -- ← The magic! Stores your dynamic questions
  added_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Example Data

When you add AirPods with 5 questions, the database will store:

```json
{
  "id": "...",
  "name": "AirPods",
  "questionnaire": [
    {
      "id": "consumption",
      "question": "Rank your need for this item (1 = need less, 5 = need more)",
      "answer": "3"
    },
    {
      "id": "need",
      "question": "How essential are AirPods to your daily audio needs?",
      "answer": "2"
    },
    {
      "id": "alternatives",
      "question": "How satisfied would you be with other wireless headphones?",
      "answer": "4"
    },
    // ... more questions
  ]
}
```

## Benefits

✅ **Simpler code** - No complex mapping logic  
✅ **More flexible** - Supports any number of questions  
✅ **Easier debugging** - See exact question-answer pairs in database  
✅ **Better performance** - JSONB is indexed and queryable  
✅ **No timeouts** - Much faster inserts  

## Troubleshooting

If you still get timeouts after resetting:
1. Check browser console for error details
2. Try different browser (disable extensions)
3. Check Network tab in DevTools to see if requests are blocked
4. Verify you're logged in correctly

## Need Help?

If you encounter issues:
1. Check the console logs (detailed logging is enabled)
2. Verify the table was created correctly in Supabase Table Editor
3. Check that RLS policies are enabled (should be automatic)
