# 🎯 Hybrid Detection: YOLO + Gemini Vision

## Problem
YOLO says "bottle/cup" for a Red Bull can — generic labels don't tell us if it's aluminum (recyclable) or plastic (depends).

## Solution
**Fast detection (YOLO) + Smart refinement (Gemini Vision)**

---

## 🔄 How It Works

### 1. **YOLO detects first (fast)**
- Finds objects in < 1 second
- Returns label + confidence + bounding box
- Example: `"bottle"` at 65% confidence

### 2. **Auto-refinement for ambiguous items**
Gemini Vision is called automatically when:
- **Label is generic:** `bottle`, `cup`, `bowl`, `container`
- **Confidence < 70%:** Uncertain detection

### 3. **Gemini looks at the image**
- Receives: Full image + YOLO label + confidence
- Returns: 
  - **Refined label:** "aluminum can"
  - **Disposal bin:** "recycling"
  - **Reason:** "Aluminum cans are widely recyclable"

### 4. **Frontend shows refined result**
- Label: "aluminum can" ✨ AI
- Confidence: 65% (original YOLO)
- Bin: → recycling
- Explanation: Short reason shown below

---

## 📊 Example Flow

### Red Bull Can Detection:

```
1. User scans Red Bull can with webcam

2. YOLO detects:
   - Label: "bottle"
   - Confidence: 0.65 (65%)
   - → Triggers refinement (ambiguous + low confidence)

3. Gemini Vision analyzes:
   - Input: Image + "YOLO said 'bottle' at 65%"
   - Output: {
       "label": "aluminum can",
       "bin": "recycling",
       "reason": "Aluminum cans are widely recyclable. Rinse before recycling."
     }

4. User sees:
   ┌─────────────────────────────────┐
   │ 🥫 aluminum can  ✨ AI          │
   │ 65% → recycling                 │
   │ Aluminum cans are widely...     │
   └─────────────────────────────────┘
```

---

## ⚙️ Configuration

### Backend: `backend/routes/infer.py`

```python
# Ambiguous labels that trigger Gemini refinement
AMBIGUOUS_LABELS = {"bottle", "cup", "bowl", "container"}

# Confidence threshold for refinement
CONFIDENCE_THRESHOLD = 0.7  # < 70% triggers Gemini
```

### Customization:
- **Add more ambiguous labels:** `AMBIGUOUS_LABELS.add("box")`
- **Adjust confidence threshold:** `CONFIDENCE_THRESHOLD = 0.6` (more refinements)
- **Disable refinement:** Comment out the `needs_refinement` check

---

## 🎨 Frontend Display

### Detection Card:
- **✨ AI badge:** Shows when Gemini refined the label
- **→ bin tag:** Shows disposal method (recycling/compost/trash)
- **Explanation:** Short reason appears below label

### No refinement needed:
```
┌─────────────────────────────────┐
│ 🍎 apple                        │
│ 92%                             │
└─────────────────────────────────┘
```

### Gemini refined:
```
┌─────────────────────────────────┐
│ 🥫 aluminum can  ✨ AI          │
│ 65% → recycling                 │
│ Aluminum cans are widely...     │
└─────────────────────────────────┘
```

---

## 🚀 Benefits

1. **Speed:** YOLO detects in < 1 second
2. **Accuracy:** Gemini clarifies ambiguous items
3. **Smart:** Only calls Gemini when needed (saves API calls)
4. **Informative:** Users see disposal method immediately
5. **Graceful fallback:** If Gemini fails, uses YOLO label

---

## 🔧 API Details

### Request: `/infer` (POST)
- **Input:** Image file (JPEG/PNG)
- **Process:**
  1. Call YOLO service
  2. For each detection:
     - If ambiguous or low confidence → Call Gemini Vision
     - Else → Use YOLO label
- **Output:** `ItemDetection[]` with optional `bin` and `explanation`

### Response Format:
```json
{
  "items": [
    {
      "label": "aluminum can",
      "confidence": 0.65,
      "bin": "recycling",
      "explanation": "Aluminum cans are widely recyclable. Rinse before recycling."
    }
  ]
}
```

---

## 💰 Cost Optimization

- **YOLO:** Free (local/self-hosted)
- **Gemini Vision:** Only called for ambiguous items (~20-30% of detections)
- **Example:** 100 scans → ~25 Gemini calls (vs 100 if always used)

---

## 🎯 When Refinement Happens

| Item | YOLO Label | Confidence | Refined? | Reason |
|------|-----------|-----------|----------|---------|
| Red Bull can | bottle | 65% | ✅ Yes | Ambiguous + Low confidence |
| Plastic cup | cup | 80% | ✅ Yes | Ambiguous label |
| Apple | apple | 92% | ❌ No | Clear label + High confidence |
| Mystery box | container | 45% | ✅ Yes | Ambiguous + Low confidence |
| Banana | banana | 88% | ❌ No | Clear label + High confidence |

---

## 📝 Notes

- **Model:** Uses `google/gemini-2.0-flash-exp:free` via OpenRouter
- **Timeout:** 45 seconds for Gemini Vision (30s for YOLO)
- **Fallback:** If Gemini fails, returns original YOLO label
- **Real-time mode:** Uses `/infer/stream` (YOLO only, no refinement)

---

## 🎉 Result

**YOLO finds it fast, Gemini names it correctly!**

Users get accurate disposal instructions without waiting for slow AI on every scan.

