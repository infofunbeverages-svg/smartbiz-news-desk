// SmartBiz News Desk — AI Pipeline v6
// Real Web Search | Auto Image | Full Automation | Free Gemini

const OR_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ── AI call ────────────────────────────────────────────────────────────────
async function ai(prompt, temp = 0.7, useSearch = false) {
  const key = import.meta.env.VITE_OPENROUTER_KEY
  if (!key) throw new Error('OpenRouter key missing in .env')

  const body = {
    model:      'openrouter/auto',
    messages:   [{ role: 'user', content: prompt }],
    temperature: temp,
    max_tokens:  700,
  }

  if (useSearch) {
    body.tools = [
      {
        type: 'web_search',
        web_search: { max_results: 3 }
      }
    ]
    body.tool_choice = 'auto'
  }

  const res = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://smartbiz-news-desk.pages.dev',
      'X-Title':       'SmartBiz News Desk',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error ${res.status}: ${err.slice(0, 150)}`)
  }

  const data    = await res.json()
  const content = data.choices[0].message.content
  if (Array.isArray(content)) {
    return content.filter(b => b.type === 'text').map(b => b.text).join('\n')
  }
  return content || ''
}

// ── Extract section ────────────────────────────────────────────────────────
function extract(text, k1, k2) {
  const e1 = k1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const e2 = k2 ? k2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null
  const pat = e2
    ? new RegExp(`${e1}:\\n([\\s\\S]*?)(?:\\n${e2}:|$)`)
    : new RegExp(`${e1}:\\n([\\s\\S]*)$`)
  const m = text.match(pat)
  return m ? m[1].trim() : ''
}

// ── Pollinations image URL ─────────────────────────────────────────────────
export function buildImageUrl(prompt, seed = Math.floor(Math.random() * 99999)) {
  const encoded = encodeURIComponent(
    prompt + ', high quality, photorealistic, 8k, dramatic lighting, professional photography'
  )
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=576&seed=${seed}&nologo=true&enhance=true`
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN PIPELINE
// ══════════════════════════════════════════════════════════════════════════
export async function runPipeline(topic, mode = 'trending', onAgent) {
  const tick = (id, state, msg) => onAgent?.(id, state, msg)

  // ── Agent 1: Real News Hunter (Web Search) ────────────────────────────
  tick(1, 'run', 'Searching real news...')
  const storyRaw = await ai(`
Search the web for the latest real news about: "${topic}"
Find ONE real, recent news story from a reputable source.

Reply in EXACT format:
TITLE:
[exact headline from the real article]
SOURCE:
[publication name — BBC, Reuters, TechCrunch etc]
URL:
[full article URL from search results]
SUMMARY:
[3 sentences: what happened. why it matters. key number or fact.]
SCORE:
[virality 1-10 for Sri Lankan Facebook]
`, 0.2, true)
  tick(1, 'done', 'Real news found ✓')

  const titleM   = storyRaw.match(/TITLE:\n(.+)/)
  const sourceM  = storyRaw.match(/SOURCE:\n(.+)/)
  const urlM     = storyRaw.match(/URL:\n(.+)/)
  const summaryM = storyRaw.match(/SUMMARY:\n([\s\S]*?)(?:\nSCORE:|$)/)
  const scoreM   = storyRaw.match(/SCORE:\n(\d+)/)

  const storyTitle   = titleM?.[1]?.trim()  || topic
  const storySource  = sourceM?.[1]?.trim() || 'News'
  const storyUrl     = urlM?.[1]?.trim()    || ''
  const storySummary = summaryM?.[1]?.trim()|| storyRaw.slice(0, 300)
  const virality     = scoreM ? Math.min(10, Math.max(1, parseInt(scoreM[1]))) : 7

  // ── Agent 2: Sinhala Article Writer ──────────────────────────────────
  tick(2, 'run', 'Writing Sinhala article...')
  const articleRaw = await ai(`
ඔබ ශ්‍රී ලාංකාවේ ජනප්‍රිය ඩිජිටල් මාධ්‍යවේදියෙකු වේ.
පුවත: ${storyTitle} | Source: ${storySource}
${storySummary}

සිංහල ලිපියක් ලියන්න:
- සිංහල script ONLY (technical terms ඉංග්‍රීසියෙන් OK)
- ඡේද 3ක් — ඡේදයකට වාක්‍ය 3යි
- කෙටි, සරල වාක්‍ය (words 12 max)
- Facts ONLY — කිසිම දෙයක් add නොකරන්න

HEADLINE_SI:
[සිංහල headline — 60 chars max]
ARTICLE_SI:
[සිංහල ලිපිය]
META_SI:
[meta description 120 chars max]
TAGS:
[6 English tags, comma separated]
`, 0.5)
  tick(2, 'done', 'Sinhala article ready ✓')

  const headline_si = extract(articleRaw, 'HEADLINE_SI', 'ARTICLE_SI') || storyTitle
  const article_si  = extract(articleRaw, 'ARTICLE_SI',  'META_SI')    || articleRaw
  const meta_desc   = extract(articleRaw, 'META_SI',     'TAGS')
  const tagsRaw     = extract(articleRaw, 'TAGS')
  const tags        = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

  // ── Agent 3: Social + English headline ───────────────────────────────
  tick(3, 'run', 'Writing social posts...')
  const socialRaw = await ai(`
ශ්‍රී ලාංකාවේ social media manager. පුවත: "${headline_si}"
${storySummary.slice(0, 200)}

FACEBOOK:
[සිංහල post. 100 words. Emojis 3. Question end. Hashtags 3.]
WHATSAPP:
[සිංහල. 60 words. Friend-style.]
PUSH:
[සිංහල. 100 chars max. Urgent.]
HEADLINE_EN:
[English headline 1 line]
`, 0.7)
  tick(3, 'done', 'Social posts ready ✓')

  const facebook    = extract(socialRaw, 'FACEBOOK', 'WHATSAPP')    || headline_si
  const whatsapp    = extract(socialRaw, 'WHATSAPP', 'PUSH')         || headline_si
  const push        = extract(socialRaw, 'PUSH',      'HEADLINE_EN') || headline_si
  const enM         = socialRaw.match(/HEADLINE_EN:\n(.+)/)
  const headline_en = enM?.[1]?.trim() || storyTitle

  // ── Agent 4: Image Prompt ─────────────────────────────────────────────
  tick(4, 'run', 'Creating image...')
  const imgPromptRaw = await ai(`
2-sentence image generation prompt for: "${headline_en}"
S1: Main subject and scene (specific, visual)
S2: Lighting, mood, photorealistic style
NO text, NO logos.
`, 0.8)
  const image_prompt = imgPromptRaw.trim()
  const image_url    = buildImageUrl(image_prompt)
  tick(4, 'done', 'Image ready ✓')

  return {
    headline_si, headline_en,
    article_si,
    article_en:   `${storyTitle}\n\n${storySummary}`,
    source_name:  storySource,
    source_url:   storyUrl,
    image_prompt,
    image_url,
    meta_desc, tags,
    all_headlines: headline_si,
    facebook, whatsapp, push,
    virality,
    policy_ok: true,
    status: 'pending',
  }
}
