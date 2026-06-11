import {
  ABILS, SAVES, SKILLS, SPELL_LEVELS, num,
  abilityMod, fmtMod, getProfBonus, saveTotal, skillTotal, passivePerception, initiativeValue,
  normalizeMember, profBonusForLevel,
} from '../../app/dnd5e.js'
import { ChevronRight, X, Plus, Sparkles } from '../Icons.jsx'

const PAGES = ['Core', 'Details', 'Spells']

// Full, editable 5e character sheet — laid out as the official three pages with
// a page navigator. Reads a normalized copy of the member and writes patches
// back through lib.updatePartyMember (so old/partial members upgrade in place).
export default function CharacterSheet({ member, lib, onBack }) {
  const c = normalizeMember(member)
  const set = (patch) => lib.updatePartyMember(c.id, patch)
  const page = c._page
  const goPage = (p) => set({ _page: Math.max(0, Math.min(2, p)) })

  // editors
  const editAbility = (k, v) => set({ abilities: { ...c.abilities, [k]: num(v, 10) } })
  const toggleSave = (a) => set({ saves: { ...c.saves, [a]: !c.saves[a] } })
  const cycleSkill = (name) => set({ skills: { ...c.skills, [name]: (num(c.skills[name], 0) + 1) % 3 } })
  const setDeath = (kind, val) => set({ deathSaves: { ...c.deathSaves, [kind]: val } })
  const editSlot = (lvl, patch) => set({ spellSlots: { ...c.spellSlots, [lvl]: { ...c.spellSlots[lvl], ...patch } } })
  const editAttack = (i, patch) => set({ attacks: c.attacks.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) })
  const addAttack = () => set({ attacks: [...c.attacks, { name: '', atk: '', damage: '' }] })
  const removeAttack = (i) => set({ attacks: c.attacks.filter((_, idx) => idx !== i) })
  const editAlly = (i, patch) => set({ allies: c.allies.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) })
  const addAlly = () => set({ allies: [...c.allies, { name: '', notes: '' }] })
  const removeAlly = (i) => set({ allies: c.allies.filter((_, idx) => idx !== i) })
  const editSpellLevel = (lvl, text) => set({ spellsByLevel: { ...c.spellsByLevel, [lvl]: text } })

  return (
    <div className="space-y-3 text-white/85">
      {/* Header + page navigator */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} title="Back to roster" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/65 transition hover:text-white">
          <ChevronRight size={12} className="rotate-180" /> Roster
        </button>
        <input value={c.name} onChange={(e) => set({ name: e.target.value })} className="min-w-0 flex-1 rounded bg-transparent font-display text-lg text-white outline-none focus:bg-white/5" />
        <button onClick={() => { lib.removePartyMember(c.id); onBack() }} title="Delete character" className="shrink-0 text-white/30 hover:text-red-300"><X size={14} /></button>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <button onClick={() => goPage(page - 1)} disabled={page === 0} className="rounded-md border border-white/10 px-1.5 py-1 text-white/55 transition hover:text-white disabled:opacity-30"><ChevronRight size={13} className="rotate-180" /></button>
        {PAGES.map((label, i) => (
          <button key={i} onClick={() => goPage(i)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${page === i ? 'bg-gradient-to-r from-aether-300 to-amethyst-400 text-ink-900' : 'border border-white/10 text-white/60 hover:text-white'}`}>
            {i + 1} · {label}
          </button>
        ))}
        <button onClick={() => goPage(page + 1)} disabled={page === 2} className="rounded-md border border-white/10 px-1.5 py-1 text-white/55 transition hover:text-white disabled:opacity-30"><ChevronRight size={13} /></button>
      </div>

      {/* ============================= PAGE 1 — CORE / COMBAT ============================= */}
      {page === 0 && (
        <>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <F label="Class & Level" value={c.classes} onChange={(v) => set({ classes: v })} placeholder="Fighter 5" />
            <F label="Total Level" value={c.level} onChange={(v) => set({ level: num(v, 1) })} numeric />
            <F label="Race" value={c.race} onChange={(v) => set({ race: v })} />
            <F label="Background" value={c.background} onChange={(v) => set({ background: v })} />
            <F label="Alignment" value={c.alignment} onChange={(v) => set({ alignment: v })} />
            <F label="Player" value={c.playerName} onChange={(v) => set({ playerName: v })} />
            <F label="XP" value={c.xp} onChange={(v) => set({ xp: v })} />
            <F label={`Prof. Bonus (auto +${profBonusForLevel(c.level)})`} value={c.profBonusOverride} onChange={(v) => set({ profBonusOverride: v })} placeholder={`+${profBonusForLevel(c.level)}`} />
            <label className="flex cursor-pointer items-end gap-1.5 pb-1">
              <input type="checkbox" checked={c.inspiration} onChange={(e) => set({ inspiration: e.target.checked })} className="accent-amethyst-400" />
              <span className="text-[11px] text-white/70">Inspiration</span>
            </label>
          </div>

          <Section title="Ability Scores">
            <div className="grid grid-cols-6 gap-1.5">
              {ABILS.map((k) => (
                <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-center">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-white/40">{k}</div>
                  <div className="font-mono text-base font-semibold text-white">{fmtMod(abilityMod(c.abilities[k]))}</div>
                  <input value={c.abilities[k]} onChange={(e) => editAbility(k, e.target.value)} className="mt-0.5 w-full rounded bg-ink-700 text-center font-mono text-[11px] text-white/70 outline-none" />
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Section title="Saving Throws">
              <div className="space-y-0.5">
                {SAVES.map((a) => (
                  <Row key={a} active={c.saves[a]} onToggle={() => toggleSave(a)} label={a} total={saveTotal(c, a)} />
                ))}
              </div>
            </Section>
            <Section title={`Skills · Passive Perception ${passivePerception(c)}`}>
              <div className="space-y-0.5">
                {SKILLS.map((s) => (
                  <Row key={s.name} level={num(c.skills[s.name], 0)} onToggle={() => cycleSkill(s.name)} label={s.name} sub={s.ability} total={skillTotal(c, s.name)} />
                ))}
              </div>
            </Section>
          </div>

          <Section title="Combat">
            <div className="grid grid-cols-4 gap-1.5">
              <Stat label="Armor Class" value={c.ac} onChange={(v) => set({ ac: v })} />
              <Stat label="Initiative" value={c.initiativeOverride} onChange={(v) => set({ initiativeOverride: v })} placeholder={fmtMod(initiativeValue(c))} />
              <Stat label="Speed" value={c.speed} onChange={(v) => set({ speed: v })} placeholder="30 ft" />
              <Stat label="Hit Dice" value={c.hitDice} onChange={(v) => set({ hitDice: v })} placeholder="5d10" />
              <Stat label="Max HP" value={c.maxHp} onChange={(v) => set({ maxHp: v })} />
              <Stat label="Current HP" value={c.hp} onChange={(v) => set({ hp: v })} />
              <Stat label="Temp HP" value={c.tempHp} onChange={(v) => set({ tempHp: v })} />
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Death Saves</div>
                <Dots label="✓" n={c.deathSaves.successes} color="bg-emerald-400" onSet={(v) => setDeath('successes', v)} />
                <Dots label="✗" n={c.deathSaves.failures} color="bg-red-400" onSet={(v) => setDeath('failures', v)} />
              </div>
            </div>
          </Section>

          <Section title="Attacks">
            <AttackTable attacks={c.attacks} editAttack={editAttack} addAttack={addAttack} removeAttack={removeAttack} />
          </Section>

          <Section title="Proficiencies, Languages & Equipment">
            <TextArea label="Other Proficiencies & Languages" value={c.proficienciesLanguages} onChange={(v) => set({ proficienciesLanguages: v })} />
            <TextArea label="Equipment" value={c.equipment} onChange={(v) => set({ equipment: v })} />
          </Section>

          <Section title="Features & Personality">
            <TextArea label="Features & Traits" value={c.features} onChange={(v) => set({ features: v })} rows={3} />
            <TextArea label="Personality Traits" value={c.personalityTraits} onChange={(v) => set({ personalityTraits: v })} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TextArea label="Ideals" value={c.ideals} onChange={(v) => set({ ideals: v })} />
              <TextArea label="Bonds" value={c.bonds} onChange={(v) => set({ bonds: v })} />
              <TextArea label="Flaws" value={c.flaws} onChange={(v) => set({ flaws: v })} />
            </div>
          </Section>
        </>
      )}

      {/* ============================= PAGE 2 — DETAILS / BACKSTORY ============================= */}
      {page === 1 && (
        <>
          <Section title="Character Appearance">
            <div className="flex gap-2">
              <Portrait c={c} set={set} />
              <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-3">
                <F label="Age" value={c.age} onChange={(v) => set({ age: v })} />
                <F label="Height" value={c.height} onChange={(v) => set({ height: v })} />
                <F label="Weight" value={c.weight} onChange={(v) => set({ weight: v })} />
                <F label="Eyes" value={c.eyes} onChange={(v) => set({ eyes: v })} />
                <F label="Skin" value={c.skin} onChange={(v) => set({ skin: v })} />
                <F label="Hair" value={c.hair} onChange={(v) => set({ hair: v })} />
              </div>
            </div>
          </Section>

          <Section title="Character Backstory">
            <TextArea value={c.backstory} onChange={(v) => set({ backstory: v })} rows={6} placeholder="Where they came from, who they were, what drives them…" />
          </Section>

          <Section title="Allies & Organizations">
            <div className="space-y-1.5">
              {c.allies.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_16px] items-center gap-1.5">
                  <input value={a.name} onChange={(e) => editAlly(i, { name: e.target.value })} placeholder="Name / faction" className="rounded bg-ink-700 px-2 py-1 text-[11px] outline-none" />
                  <input value={a.notes} onChange={(e) => editAlly(i, { notes: e.target.value })} placeholder="Notes / relationship" className="rounded bg-ink-700 px-2 py-1 text-[11px] outline-none" />
                  <button onClick={() => removeAlly(i)} className="text-white/25 hover:text-red-300"><X size={11} /></button>
                </div>
              ))}
              <button onClick={addAlly} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/55 hover:text-white"><Plus size={11} /> Add ally / organization</button>
            </div>
          </Section>

          <Section title="Additional Features & Traits">
            <TextArea value={c.additionalFeatures} onChange={(v) => set({ additionalFeatures: v })} rows={4} />
          </Section>

          <Section title="Treasure">
            <TextArea value={c.treasure} onChange={(v) => set({ treasure: v })} rows={3} placeholder="Coins, gems, magic items…" />
          </Section>
        </>
      )}

      {/* ============================= PAGE 3 — SPELLS ============================= */}
      {page === 2 && (
        <>
          <Section title="Spellcasting">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <F label="Spellcasting Class" value={c.spellClass} onChange={(v) => set({ spellClass: v })} />
              <F label="Spellcasting Ability" value={c.spellcastingAbility} onChange={(v) => set({ spellcastingAbility: v })} placeholder="WIS" />
              <F label="Spell Save DC" value={c.spellSaveDC} onChange={(v) => set({ spellSaveDC: v })} />
              <F label="Spell Atk Bonus" value={c.spellAtkBonus} onChange={(v) => set({ spellAtkBonus: v })} />
            </div>
            <div className="mt-2">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">Spell Slots (total / used)</div>
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
                {SPELL_LEVELS.map((lvl) => (
                  <div key={lvl} className="flex items-center gap-1 rounded bg-white/[0.03] px-1 py-0.5">
                    <span className="text-[9px] text-white/40">L{lvl}</span>
                    <input value={c.spellSlots[lvl]?.total ?? ''} onChange={(e) => editSlot(lvl, { total: e.target.value })} className="w-5 rounded bg-ink-700 text-center text-[10px] outline-none" />
                    <span className="text-white/25">/</span>
                    <input value={c.spellSlots[lvl]?.used ?? ''} onChange={(e) => editSlot(lvl, { used: e.target.value })} className="w-5 rounded bg-ink-700 text-center text-[10px] outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Cantrips (Level 0)">
            <TextArea value={c.cantrips} onChange={(v) => set({ cantrips: v })} placeholder="Sacred Flame, Light, Guidance…" />
          </Section>

          <Section title="Spells by Level">
            <div className="space-y-1.5">
              {SPELL_LEVELS.map((lvl) => (
                <div key={lvl}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-amethyst-200">Level {lvl}</span>
                    <span className="text-[9px] text-white/30">slots {c.spellSlots[lvl]?.total || 0}</span>
                  </div>
                  <TextArea value={c.spellsByLevel[lvl]} onChange={(v) => editSpellLevel(lvl, v)} placeholder={`Level ${lvl} spells…`} />
                </div>
              ))}
            </div>
          </Section>

          {c.spells ? (
            <Section title="Other / Unsorted Spells">
              <TextArea value={c.spells} onChange={(v) => set({ spells: v })} />
            </Section>
          ) : null}
        </>
      )}

      <p className="pt-1 text-[9px] text-white/30">
        Page {page + 1} of 3 · ✦ modifiers, prof bonus, saves &amp; skills computed automatically · all fields editable · saved to this campaign
      </p>
    </div>
  )
}

// ---- small building blocks --------------------------------------------------
function Section({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amethyst-300">
        <Sparkles size={11} /> {title}
      </p>
      {children}
    </div>
  )
}

function AttackTable({ attacks, editAttack, addAttack, removeAttack }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_46px_1fr_16px] gap-1 px-1 text-[8px] uppercase tracking-wider text-white/35">
        <span>Name</span><span>Atk</span><span>Damage/Type</span><span />
      </div>
      {attacks.map((a, i) => (
        <div key={i} className="grid grid-cols-[1fr_46px_1fr_16px] items-center gap-1">
          <input value={a.name} onChange={(e) => editAttack(i, { name: e.target.value })} placeholder="Longsword" className="rounded bg-ink-700 px-1.5 py-1 text-[11px] outline-none" />
          <input value={a.atk} onChange={(e) => editAttack(i, { atk: e.target.value })} placeholder="+7" className="rounded bg-ink-700 px-1 py-1 text-center text-[11px] outline-none" />
          <input value={a.damage} onChange={(e) => editAttack(i, { damage: e.target.value })} placeholder="1d8+4 slashing" className="rounded bg-ink-700 px-1.5 py-1 text-[11px] outline-none" />
          <button onClick={() => removeAttack(i)} className="text-white/25 hover:text-red-300"><X size={11} /></button>
        </div>
      ))}
      <button onClick={addAttack} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/55 hover:text-white"><Plus size={11} /> Add attack</button>
    </div>
  )
}

function Portrait({ c, set }) {
  return (
    <div className="shrink-0">
      <div className="flex h-[88px] w-[72px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-aether-500/30 to-amethyst-500/30">
        {c.portrait ? (
          <img src={c.portrait} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <span className="font-display text-2xl text-white/80">{(c.name || '?').trim().charAt(0).toUpperCase()}</span>
        )}
      </div>
      <input value={c.portrait} onChange={(e) => set({ portrait: e.target.value })} placeholder="image URL" className="mt-1 w-[72px] rounded bg-ink-700 px-1 py-0.5 text-[8px] text-white/70 placeholder:text-white/25 outline-none" />
    </div>
  )
}

function F({ label, value, onChange, placeholder, numeric }) {
  return (
    <label className="block min-w-0">
      <span className="block truncate text-[8px] uppercase tracking-wider text-white/40">{label}</span>
      <input
        value={value ?? ''}
        inputMode={numeric ? 'numeric' : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-ink-700 px-1.5 py-1 text-[11px] text-white/85 placeholder:text-white/25 outline-none focus:border-amethyst-400/50"
      />
    </label>
  )
}

function Stat({ label, value, onChange, placeholder }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-center">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <input value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-0.5 w-full rounded bg-ink-700 text-center font-mono text-sm text-white/90 placeholder:text-white/25 outline-none" />
    </div>
  )
}

function Row({ active, level, onToggle, label, sub, total }) {
  const lvl = level !== undefined ? level : active ? 1 : 0
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition hover:bg-white/5">
      <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border text-[7px] ${lvl === 0 ? 'border-white/25' : lvl === 1 ? 'border-amethyst-400 bg-amethyst-400' : 'border-aether-300 bg-aether-300'}`}>
        {lvl === 2 ? <span className="text-ink-900">★</span> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-white/80">{label}{sub ? <span className="text-white/30"> ({sub})</span> : null}</span>
      <span className="shrink-0 font-mono text-white/85">{fmtMod(total)}</span>
    </button>
  )
}

function Dots({ label, n, color, onSet }) {
  return (
    <div className="mt-0.5 flex items-center gap-1">
      <span className="w-3 text-[10px] text-white/40">{label}</span>
      {[1, 2, 3].map((i) => (
        <button key={i} onClick={() => onSet(n >= i ? i - 1 : i)} className={`h-2.5 w-2.5 rounded-full border border-white/20 ${n >= i ? color : 'bg-transparent'}`} />
      ))}
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 2, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-[8px] uppercase tracking-wider text-white/40">{label}</span>}
      <textarea
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full resize-none rounded border border-white/10 bg-ink-700 px-2 py-1 text-[11px] leading-snug text-white/85 placeholder:text-white/25 outline-none focus:border-amethyst-400/50"
      />
    </label>
  )
}
