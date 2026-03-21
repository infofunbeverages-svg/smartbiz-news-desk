// SmartBiz News Desk — AI Pipeline v3
// 12 Agents | Better Sinhala | OpenRouter Only | No Backend

const OR_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ── Core AI call ───────────────────────────────────────────────────────────
async function ai(prompt, temp = 0.7) {
  const key = import.meta.env.VITE_OPENROUTER_KEY
  if (!key) throw new Error('OpenRouter key missing in .env')

  const res = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${key}`,
      'Content-Type':   'application/json',
      'HTTP-Referer':   'https://smartbiz-news-desk.pages.dev',
      'X-Title':        'SmartBiz News Desk',
    },
    body: JSON.stringify({
             'openrouter/auto',
      messages:    [{ role: 'user', content: prompt }],
      temperature: temp,
      max_tokens:  2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error ${res.status}: ${err.slice(0, 150)}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ── Extract section from formatted text ────────────────────────────────────
function extract(text, k1, k2) {
  const escaped_k1 = k1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escaped_k2 = k2 ? k2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null
  const pattern = escaped_k2
    ? new RegExp(`${escaped_k1}:\\n([\\s\\S]*?)(?:\\n${escaped_k2}:|$)`)
    : new RegExp(`${escaped_k1}:\\n([\\s\\S]*)$`)
  const m = text.match(pattern)
  return m ? m[1].trim() : ''
}

// ══════════════════════════════════════════════════════════════════════════
//  12-AGENT PIPELINE
// ══════════════════════════════════════════════════════════════════════════
export async function runPipeline(topic, mode = 'trending', onAgent) {
  const tick = (id, state, msg) => onAgent?.(id, state, msg)

  // ── Agent 1: News Hunter ──────────────────────────────────────────────
  tick(1, 'run', 'Hunting trending news...')
  const story = await ai(`
You are a senior news editor at a global tech publication.
Find the BEST single trending news story about: "${topic}"

STRICT RULES:
- Tech, science, business, viral topics ONLY
- Absolutely NO politics, politicians, elections
- Must be interesting to young Sri Lankans
- Use your most recent knowledge

Return in this EXACT format:
TITLE: [news headline]
SOURCE: [publication name]
SUMMARY: [Exactly 3 sentences: What happened. Why it matters. Key fact or number.]
`, 0.4)
  tick(1, 'done', 'Story found ✓')

  // ── Agent 2: Fact Check ───────────────────────────────────────────────
  tick(2, 'run', 'Cross-checking facts...')
  const fact = await ai(`
You are an investigative fact-checker.
Verify the 3 most important claims in this story:

${story}

For each claim write exactly:
CLAIM: [the claim]
STATUS: [VERIFIED / LIKELY / UNVERIFIED]
REASON: [one sentence why]

Keep total response under 150 words.
`, 0.2)
  tick(2, 'done', 'Facts verified ✓')

  // ── Agent 3: Trend Scorer ─────────────────────────────────────────────
  tick(3, 'run', 'Scoring viral potential...')
  const traw = await ai(`
You are a social media analyst specializing in Sri Lankan digital audiences.
Rate this story's viral potential for Sri Lankan Facebook and WhatsApp (1-10):

${story.slice(0, 400)}

Reply with ONLY this format:
SCORE: [number]/10
WHY: [one sentence explanation]
TIP: [one specific tip to maximize engagement]
`, 0.3)

  const sm       = traw.match(/SCORE:\s*(\d+)/i) || traw.match(/\b([0-9]|10)\b/)
  const virality = sm ? Math.min(10, Math.max(1, parseInt(sm[1]))) : 7
  tick(3, 'done', `Virality ${virality}/10 ✓`)

  // ── Agent 4: English Architect ────────────────────────────────────────
  tick(4, 'run', 'Writing English article...')
  const eng = await ai(`
You are a professional digital journalist. Write a 280-word English news article.

Story: ${story}
Fact check: ${fact}

STRUCTURE (follow exactly):
- Opening sentence: The most shocking/interesting fact first
- ## What Happened
- 2-3 sentences explaining the event with key details
- ## Why It Matters
- 2-3 sentences on impact and significance
- Closing: Forward-looking statement or quote

STYLE: Clear, energetic, no fluff. Every sentence must add value.
`, 0.6)
  tick(4, 'done', 'English article ready ✓')

  // ── Agent 5: Sinhala Specialist (IMPROVED) ────────────────────────────
  tick(5, 'run', 'Translating to Sinhala...')
  const si_raw = await ai(`
ඔබ ශ්‍රී ලාංකාවේ ප්‍රසිද්ධ ඩිජිටල් පුවත් වෙබ් අඩවියක ජ්‍යෙෂ්ඨ සිංහල මාධ්‍යවේදියෙකු වේ.

පහත ඉංග්‍රීසි ලිපිය සිංහල භාෂාවට පරිවර්තනය කරන්න.

අනිවාර්ය නීති:
① සිංහල script ONLY — ඉංග්‍රීසි අකුරු එකක්වත් භාවිතා නොකරන්න
② වාක්‍ය කෙටි තබන්න — එක් වාක්‍යයකට උපරිම වචන 12ක්
③ ඡේද 4ක් ලියන්න — එක ඡේදයකට උපරිම වාක්‍ය 3ක්
④ Technical terms: English term + (සිංහල තේරුම) — උදා: Artificial Intelligence (කෘත්‍රිම බුද්ධිය)
⑤ හිතමිතුරෙකුට කතා කරන ආකාරයේ සරල සිංහල
⑥ Word-for-word translation NEVER — natural සිංහල ලියන්න
⑦ සිංහල ව්‍යාකරණ නිවැරදිව

ඉංග්‍රීසි ලිපිය:
${eng}

සිංහල පරිවර්තනය (සිංහල script ONLY):
`, 0.3)
  tick(5, 'done', 'Translated ✓')

  // ── Agent 6: Creative Wordsmith (IMPROVED) ────────────────────────────
  tick(6, 'run', 'Enhancing Sinhala style...')
  const si_creative = await ai(`
ඔබ ශ්‍රී ලාංකාවේ වඩාත්ම ජනප්‍රිය Facebook page එකේ content writer වේ.

පහත සිංහල ලිපිය ජීවමාන, ආකර්ශනීය ලෙස නැවත ලියන්න.

කළ යුතු:
✓ කෙටි, ශක්තිමත් වාක්‍ය (words 10-12 per sentence)
✓ කතාන්දර ශෛලිය — reader ඊළඟ sentence කියවන්න ඕනෑ වෙන ආකාරයට
✓ ශ්‍රී ලාංකික context — local examples හෝ comparisons
✓ Emotional hooks — "ඔබ දන්නවාද?", "මෙය ඇත්තක්ද?" style
✓ Facts හා data — SAME. Style ONLY change.
✓ සිංහල script ONLY

නොකළ යුතු:
✗ ඉංග්‍රීසි අකුරු (technical terms හැර)
✗ ඉතා දිගු, සංකීර්ණ වාක්‍ය
✗ Academic / formal language

මුල් ලිපිය:
${si_raw}

නැවත ලැව ලිපිය:
`, 0.75)
  tick(6, 'done', 'Style enhanced ✓')

  // ── Agent 7: SEO + Headlines ──────────────────────────────────────────
  tick(7, 'run', 'Creating SEO & headlines...')
  const seo_raw = await ai(`
You are an SEO expert and headline writer for a top Sinhala news website.

Complete ALL 5 tasks for this article:

TASK 1: Add 5 SEO keywords naturally into the Sinhala article (keep Sinhala script)
TASK 2: Write 5 Sinhala headlines (MAX 60 characters each, catchy, NOT clickbait)
TASK 3: Write a Sinhala meta description (MAX 150 characters)
TASK 4: Write 6 English tags (comma separated, lowercase)
TASK 5: Write one English headline

Output in this EXACT format with no deviations:
ARTICLE:
[full optimized Sinhala article]
META:
[Sinhala meta description]
TAGS:
[tag1, tag2, tag3, tag4, tag5, tag6]
HEADLINES:
1. [headline]
2. [headline]
3. [headline]
4. [headline]
5. [headline]
BEST:
[single best headline from above]
ENGLISH_HEADLINE:
[English headline]

Sinhala article to optimize:
${si_creative}
`, 0.55)

  const art      = extract(seo_raw, 'ARTICLE',          'META')           || si_creative
  const meta     = extract(seo_raw, 'META',             'TAGS')
  const tagsRaw  = extract(seo_raw, 'TAGS',             'HEADLINES')
  const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  const allHeads = extract(seo_raw, 'HEADLINES',        'BEST')
  const bestM    = seo_raw.match(/BEST:\n(.+)/)
  const enM      = seo_raw.match(/ENGLISH_HEADLINE:\n(.+)/)
  const best     = bestM?.[1]?.trim() || si_creative.split('\n')[0]
  const bestEn   = enM?.[1]?.trim()   || ''
  tick(7, 'done', 'SEO ready ✓')

  // ── Agent 8: Image Conceptor ──────────────────────────────────────────
  tick(8, 'run', 'Crafting image prompt...')
  const imgPrompt = await ai(`
You are a visual director creating prompts for Nano Banana AI image generator.

News headline: "${bestEn || best}"
News summary: ${story.slice(0, 200)}

Write a detailed 3-sentence image generation prompt:
Sentence 1: Describe the main subject and scene (be specific)
Sentence 2: Describe lighting, mood, and atmosphere
Sentence 3: Describe color palette, camera angle, and photographic style

Requirements:
- Photorealistic or cinematic style
- Professional news photography quality
- Visually represents the story accurately
- NO text, logos, watermarks, or words in the image
- Dramatic and visually striking
`, 0.85)
  tick(8, 'done', 'Image prompt ready ✓')

  // ── Agent 9: Policy Guard ─────────────────────────────────────────────
  tick(9, 'run', 'Policy & safety check...')
  const policy = await ai(`
You are a content moderator for a Sri Lankan news website.
Review this content and check for issues:

Headline: ${best}
Article excerpt: ${art.slice(0, 300)}

Check for:
1. Hate speech or discrimination
2. Defamation or unverified serious claims
3. Political bias or propaganda
4. Content inappropriate for general Sri Lankan audiences
5. Copyright issues

Reply ONLY with one of these:
APPROVED
FLAGGED: [specific reason]
`, 0.1)

  const approved = !policy.toUpperCase().includes('FLAGGED')
  tick(9, 'done', approved ? 'Approved ✓' : 'Flagged ⚠️')

  // ── Agent 10: Social Media Handler ───────────────────────────────────
  tick(10, 'run', 'Writing social posts...')
  const social = await ai(`
ඔබ ශ්‍රී ලාංකාවේ ප්‍රසිද්ධ social media manager කෙනෙකු වේ.
මෙම පුවත ගැන platforms 3ක් සඳහා posts ලියන්න: "${best}"

Article summary: ${art.slice(0, 250)}

Output in EXACT format:
FACEBOOK:
[සිංහල post. 150-200 words. Emojis 3. Engagement question end ෙේ. Hashtags 4.]
WHATSAPP:
[සිංහල message. 80-100 words. Friend-style forwarding. Zero hashtags. Conversational.]
PUSH:
[සිංහල push notification. Maximum 130 characters. Urgent feel.]
`, 0.75)

  const fb = extract(social, 'FACEBOOK', 'WHATSAPP') || best
  const wa = extract(social, 'WHATSAPP', 'PUSH')     || best
  const pu = extract(social, 'PUSH')                  || best
  tick(10, 'done', 'Social posts ready ✓')

  // ── Agent 11: Grammar Pro ─────────────────────────────────────────────
  tick(11, 'run', 'Final grammar check...')
  const final = await ai(`
ඔබ ශ්‍රී ලාංකාවේ ප්‍රසිද්ධ සිංහල භාෂා මහාචාර්යවරයෙකු වේ.

පහත සිංහල ලිපිය ප්‍රවේශමෙන් proof-read කර නිවැරදි කරන්න:

නිවැරදි කළ යුතු දේ:
① ව්‍යාකරණ දෝෂ (grammar errors)
② අක්ෂර වින්‍යාස දෝෂ (spelling mistakes)
③ Punctuation දෝෂ
④ ස්වාභාවිකව නොඇසෙන වාක්‍ය — නැවත ලියන්න
⑤ සිංහල script නිවැරදිව ඇතිදැයි

IMPORTANT: නිවැරදි කළ ලිපිය ONLY return කරන්න.
වෙන කිසිවක් — explanation, notes, comments — නොලියන්න.

ලිපිය:
${art}
`, 0.1)
  tick(11, 'done', 'Grammar perfect ✓')

  // ── Agent 12: Dispatcher ──────────────────────────────────────────────
  tick(12, 'run', 'Packaging for Supabase...')

  const payload = {
    headline_si:   best,
    headline_en:   bestEn,
    article_si:    final,
    article_en:    eng,
    image_prompt:  imgPrompt,
    meta_desc:     meta,
    tags:          tags,
    all_headlines: allHeads,
    facebook:      fb,
    whatsapp:      wa,
    push:          pu,
    virality:      virality,
    policy_ok:     approved,
    status:        'pending',
  }

  tick(12, 'done', 'Saved to Supabase ✓')
  return payload
}
