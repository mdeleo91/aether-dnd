import {
  ABILS, SAVES, SKILLS, SPELL_LEVELS, num,
  abilityMod, fmtMod, getProfBonus, saveTotal, skillTotal, passivePerception, initiativeValue,
  normalizeMember, profBonusForLevel,
} from '../../app/dnd5e.js'
import { ChevronRight, X, Plus, Sparkles } from '../Icons.jsx'

// Full, editable 5e character sheet. Reads a normalized copy of the member and
// writes patches back through lib.updatePartyMember — so old/partial members are
// upgraded in place as they're edited.
export default function CharacterSheet({ member, lib, onBack }) {
  const c = normalizeMember(member)
  const set = (patch) => lib.updatePartyMember(c.id, patch)
  const editAbility = (k, v) => set({ abilities: { ...c.abilities, [k]: num(v, 10) } })
  const toggleSave = (a) => set({ saves: { ...c.saves, [a]: !c.saves[a] } })
  const cycleSkill = (name) => set({ skills: { ...c.skills, [name]: (num(c.skills[name], 0) + 1) % 3 } })
  const setDeath = (kind, val) => set({ deathSaves: { ...c.deathSaves, [kind]: val } })
  const editSlot = (lvl, patch) => set({ spellSlots: { ...c.spellSlots, [lvl]: { ...c.spellSlots[lvl], ...patch } } })
  const editAttack = (i, patch) => set({ attacks: c.attacks.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) })
  const addAttack = () => set({ attacks: [...c.attacks, { name: '', atk: '', damage: '' }] })
  const removeAttack = (i) => set({ attacks: c.attacks.filter((_, idx) => idx !== i) })

  const pb = getProfBonus(c)

  return (
    <div className="space-y-3 text-white/85">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} title="Back to roster" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/65 transition hover:text-white">
          <ChevronRight size={12} className="rotate-180" /> Roster
        </button>
        <input value={c.name} onChange={(e) => set({ name: e.target.value })} className="min-w-0 flex-1 rounded bg-transparent font-display text-lg text-white outline-none focus:bg-white/5" />
        <button onClick={() => { lib.removePartyMember(c.id); onBack() }} title="Delete character" className="shrink-0 text-white/30 hover:text-red-300"><X size={14} /></button>
      </div>

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

      {/* Abilities */}
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

      {/* Saves + Skills */}
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

      {/* Combat */}
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

      {/* Attacks */}
      <Section title="Attacks & Spellcasting">
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_46px_1fr_16px] gap-1 px-1 text-[8px] uppercase tracking-wider text-white/35">
            <span>Name</span><span>Atk</span><span>Damage/Type</span><span />
          </div>
          {c.attacks.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_46px_1fr_16px] items-center gap-1">
              <input value={a.name} onChange={(e) => editAttack(i, { name: e.target.value })} placeholder="Longsword" className="rounded bg-ink-700 px-1.5 py-1 text-[11px] outline-none" />
              <input value={a.atk} onChange={(e) => editAttack(i, { atk: e.target.value })} placeholder="+7" className="rounded bg-ink-700 px-1 py-1 text-center text-[11px] outline-none" />
              <input value={a.damage} onChange={(e) => editAttack(i, { damage: e.target.value })} placeholder="1d8+4 slashing" className="rounded bg-ink-700 px-1.5 py-1 text-[11px] outline-none" />
              <button onClick={() => removeAttack(i)} className="text-white/25 hover:text-red-300"><X size={11} /></button>
            </div>
          ))}
          <button onClick={addAttack} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/55 hover:text-white"><Plus size={11} /> Add attack</button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <F label="Spellcasting Class" value={c.spellClass} onChange={(v) => set({ spellClass: v })} />
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
          <TextArea className="mt-1.5" placeholder="Known / prepared spells…" value={c.spells} onChange={(v) => set({ spells: v })} />
        </div>
      </Section>

      {/* Narrative */}
      <Section title="Features, Proficiencies & Equipment">
        <TextArea label="Features & Traits" value={c.features} onChange={(v) => set({ features: v })} />
        <TextArea label="Other Proficiencies & Languages" value={c.proficienciesLanguages} onChange={(v) => set({ proficienciesLanguages: v })} />
        <TextArea label="Equipment" value={c.equipment} onChange={(v) => set({ equipment: v })} />
      </Section>

      <Section title="Personality & Backstory">
        <TextArea label="Personality Traits" value={c.personalityTraits} onChange={(v) => set({ personalityTraits: v })} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TextArea label="Ideals" value={c.ideals} onChange={(v) => set({ ideals: v })} />
          <TextArea label="Bonds" value={c.bonds} onChange={(v) => set({ bonds: v })} />
          <TextArea label="Flaws" value={c.flaws} onChange={(v) => set({ flaws: v })} />
        </div>
        <TextArea label="Backstory & Notes" value={c.backstory} onChange={(v) => set({ backstory: v })} rows={3} />
      </Section>

      <p className="pt-1 text-[9px] text-white/30">✦ Modifiers, proficiency bonus, saves &amp; skills computed automatically · all fields editable · saved to this campaign</p>
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

// Toggle row for saves (active bool) or skills (level 0/1/2).
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
