# The script: a flexible seven-beat What If reference

This is a storytelling reference for What If episodes, not a mandatory structure for every theme. Adapt the seven
beats to AnimationFusion's user-selected 30–60 second duration. Keep the premise original, make the visual plan first,
and give the first short its own payoff and spoken CTA. Do not shorten the user's duration to the older 15–25 second
shape that appears in earlier examples below.

## The seven beats

1. **Cold open in the middle of the action.** A flash-forward to the climax, or three or four quick demos of the
   power.
2. **The premise and its rules.** What changed overnight, and the rules it comes with.
3. **The fun part.** Escalating wins in everyday life.
4. **The not-so-fun part.** The cost, with real science and real numbers woven into the story ("That's real.").
5. **Someone powerful notices.** A man in a suit, robbers, a government.
6. **A moral choice with family at stake,** usually a little sister.
7. **Payoff and next action.** Resolve the short's main promise, then use a short CTA. A cliffhanger or Part 2 belongs
   only in a planned series; it is never required to hold the answer back.

Recurring cast: you (second person), a best friend, a little sister, mum. In our cast: Pip is "you", Mo is the best
friend, and `sis`, `mom` and `suit` are on the rig for beats 5 and 6.

## Adapt the beats to the chosen 30–60 seconds

Use the exact duration saved for the episode; this example only shows a possible 45-second balance:

| Beat | Approximate time | What it does |
|---|---:|---|
| 1. Cold open | 0–3 s | Hook with an image, choice, or problem already in motion. |
| 2. Premise | 3–8 s | Explain the rule with one clear visual. |
| 3. Escalation | 8–20 s | Show increasingly useful or surprising consequences. |
| 4. Cost or proof | 20–30 s | Add a sourced fact or a consequence when the idea needs one. |
| 5. Complication | 30–37 s | A character, obstacle, or visible change raises the stakes. |
| 6. Choice or reversal | 37–43 s | Force a meaningful decision or reveal. |
| 7. Payoff and CTA | 43–45 s | Resolve the promise and deliver the spoken CTA. |

For another duration, stretch or compress the beats to match the narration and visual plan. A/B choice stories should
show both options, give the first short a satisfying outcome, and invite a vote. Do not add a cliffhanger, a Part 2
promise, or extra beats merely to fill time.

## Writing rules

- **Second person, present tense, short sentences.** Three to eight words. "Copy a cookie. Paste." beats "Imagine if
  you were able to duplicate a cookie."
- **Every line is a picture.** Each demo has to read in one shot with no text on screen: a mug, a stair, a quiz, a
  cookie, a friend. If a line needs a caption to be understood, rewrite the line.
- **The power has a word, a sound and a look.** "Rewind" plus tape whirr plus a stopwatch counting back; "Copy...
  Paste" plus a selection box plus a pop. Say the word in every demo, so the viewer learns the grammar by the third.
- **Escalate the demos.** Small and selfish, then useful, then a little uncanny (a cookie, the homework, your best
  friend). The third demo should make the viewer slightly uneasy: it sets up the turn.
- **One real fact in the turn, with a number, checked.** Work the arithmetic, write it in the episode's `science`
  field with its source, and only then put it in the script. "That's real." goes straight after it. Never invent a
  number, never round one into a different claim.
- **Finish with a payoff.** A question can invite a vote, but answer the short's core promise before the CTA.
- **Length:** draft for the chosen 30–60 seconds and check the actual local voice timing. As a rough writing guide,
  75–150 spoken words can fit that interval; pauses, delivery, and sentence shape matter more than a strict count.
  Local voices are the default; paid voice APIs are optional.
- **The title card** is the premise, in capitals: line 1 `WHAT IF YOU COULD`, line 2 the power in four words or
  fewer with a question mark. One word of line 2 can pulse as the accent (`10`, `ANYTHING`).

## Choosing a topic

- An everyday power with clear rules and a hidden cost works best: time (rewind, pause, skip), copies, senses (hear
  thoughts, see an hour ahead), body (never sleep, 10x reaction), money, luck.
- The cost should come from real science (energy, biology, physics, economics), so beat 4 can teach something true.
- Don't remake a channel's episode: search YouTube for the premise first, and if a What If channel already has that
  exact title, pick a different power or a different rule. Most everyday powers have been done somewhere (copy-paste
  turned up a comedy short and a "Copy Powers" episode); the story, the rule and the turn are what make it ours.
  The formula is shared; the stories are ours.
- No real people, no brands, no famous characters, nothing that resembles one.

## episode.json: the script part

The copy-paste example (`studio/src/episodes/copy-paste/episode.json`), about 61 words and 23 seconds, is a legacy
schema example only; lengthen or rebuild it to meet the selected 30–60 second production target:

```json
"topic": "What if you could copy and paste anything?",
"title": ["WHAT IF YOU COULD", "COPY AND PASTE ANYTHING?"],
"script": [
  {"beat": "1 cold open, demo 1 (small and selfish)", "text": "Copy a cookie. Paste. Free cookies, forever."},
  {"beat": "1 cold open, demo 2 (useful)", "text": "Copy your homework. Paste. Done."},
  {"beat": "1 cold open, demo 3 (a little uncanny)", "text": "Copy your best friend. Paste. Okay, that's weird."},
  {"beat": "2 the premise (title card)", "text": "What if you could copy and paste anything?"},
  {"beat": "4 the turn: the cost, one real fact", "text": "One catch: a copy can't come from nothing. One cookie, made from pure energy, needs every power plant on Earth running for over ten minutes. That's real."},
  {"beat": "5-7 folded into a question", "text": "So where are yours coming from?"}
],
"science": [
  {"claim": "One cookie made from pure energy needs every power plant on Earth running for over ten minutes.",
   "working": "A 30 g cookie: E = mc^2 = 2.70e15 J. World electricity, 29,925 TWh in 2023 = 3.4e12 W on average. 2.70e15 / 3.4e12 = about 13 minutes. Over ten minutes holds above about 24 g; the schematic states the 30 g.",
   "source": "mass-energy equivalence; Ember, Global Electricity Review 2024"}
]
```

`voice.py` joins the beats' text with spaces and sends it as one take, so the read flows; the beats are for you and
for the storyboard.
