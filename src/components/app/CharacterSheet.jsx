import {
  ABILS, SAVES, SKILLS, SPELL_LEVELS, num,
  abilityMod, fmtMod, getProfBonus, saveTotal, skillTotal, passivePerception, initiativeValue,
  normalizeMember, profBonusForLevel,
} from '../../app/dnd5e.js'
import { ChevronRight, X, Plus } from '../Icons.jsx'

const PAGES = ['Core', 'Details', 'Spells']

// Parchment surface for the sheet body — aged ivory with a soft inset glow so it
// reads like a real character sheet lying on the DM's desk inside the app window.
const SHEET_STYLE = {
  background:
    'radial-gradient(135% 120% at 50% -10%, #f8f1da 0%, #f1e7c8 50%, #e8dab4 100%)',
  boxShadow: 'inset 0 0 44px rgba(120,96,50,0.18), inset 0 0 1px rgba(80,60,28,0.4)',
}

// Full, editable 5e character sheet — laid out as the official three pages, styled
// to mirror the recognizable boxed Wizards sheet. Reads a normalized copy of the
// member and writes patches back through lib.updatePartyMember.
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
    <div className="space-y-2.5">
      {/* ---- app chrome: roster / name / delete + page navigator (kept dark) ---- */}
      <div className="flex items-center gap-2 text-white/85">
        <button onClick={onBack} title="Back to roster" className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/65 transition hover:text-white">
          <ChevronRight size={12} className="rotate-180" /> Roster
        </button>
        <input value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Character name" className="min-w-0 flex-1 rounded bg-transparent font-display text-base text-white outline-none focus:bg-white/5" />
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

      {/* ============================ THE PARCHMENT SHEET ============================ */}
      <div className="rounded-lg p-2.5" style={SHEET_STYLE}>
        {/* --------------------------------- PAGE 1 --------------------------------- */}
        {page === 0 && (
          <div className="grid grid-cols-12 gap-2">
            {/* header: name box + identity grid */}
            <Box className="col-span-12 sm:col-span-4" label="Character Name">
              <Ink value={c.name} onChange={(v) => set({ name: v })} big className="font-display" />
            </Box>
            <div className="col-span-12 grid grid-cols-3 gap-2 sm:col-span-8 sm:grid-cols-3">
              <FieldBox label="Class & Level" value={c.classes} onChange={(v) => set({ classes: v })} placeholder="Fighter 5" />
              <FieldBox label="Background" value={c.background} onChange={(v) => set({ background: v })} />
              <FieldBox label="Player Name" value={c.playerName} onChange={(v) => set({ playerName: v })} />
              <FieldBox label="Race" value={c.race} onChange={(v) => set({ race: v })} />
              <FieldBox label="Alignment" value={c.alignment} onChange={(v) => set({ alignment: v })} />
              <FieldBox label="Experience Points" value={c.xp} onChange={(v) => set({ xp: v })} />
            </div>

            {/* LEFT STRIP — ability scores */}
            <div className="col-span-3 space-y-3.5">
              {ABILS.map((k) => (
                <AbilityBox key={k} k={k} mod={abilityMod(c.abilities[k])} score={c.abilities[k]} onScore={(v) => editAbility(k, v)} />
              ))}
            </div>

            {/* MIDDLE — inspiration / prof / saves / skills / passive */}
            <div className="col-span-5 space-y-2 sm:col-span-4">
              <div className="grid grid-cols-2 gap-2">
                <PillBox label="Inspiration">
                  <button onClick={() => set({ inspiration: !c.inspiration })} className="mx-auto block h-5 w-5 rotate-45 rounded-[3px] border-[1.5px] border-[#6f6044]" style={{ background: c.inspiration ? '#6f6044' : 'transparent' }} />
                </PillBox>
                <PillBox label="Proficiency Bonus">
                  <Ink value={c.profBonusOverride} onChange={(v) => set({ profBonusOverride: v })} center mono className="text-base" placeholder={`+${profBonusForLevel(c.level)}`} />
                </PillBox>
              </div>
              <TitledBox title="Saving Throws">
                {SAVES.map((a) => (
                  <ProfRow key={a} level={c.saves[a] ? 1 : 0} onToggle={() => toggleSave(a)} total={saveTotal(c, a)} label={a} />
                ))}
              </TitledBox>
              <TitledBox title="Skills">
                {SKILLS.map((s) => (
                  <ProfRow key={s.name} level={num(c.skills[s.name], 0)} onToggle={() => cycleSkill(s.name)} total={skillTotal(c, s.name)} label={s.name} sub={s.ability} />
                ))}
              </TitledBox>
              <div className="flex items-center gap-2 rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 px-2 py-1">
                <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded border-[1.5px] border-[#9c8a61] bg-[#f4ecd5] font-mono text-sm text-[#2c2114]">{passivePerception(c)}</span>
                <span className="text-[8px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#766440]">Passive Wisdom (Perception)</span>
              </div>
            </div>

            {/* RIGHT — combat / attacks */}
            <div className="col-span-4 space-y-2 sm:col-span-4">
              <div className="grid grid-cols-3 gap-2">
                <CenterBox label="Armor Class" value={c.ac} onChange={(v) => set({ ac: v })} />
                <CenterBox label="Initiative" value={c.initiativeOverride} onChange={(v) => set({ initiativeOverride: v })} placeholder={fmtMod(initiativeValue(c))} />
                <CenterBox label="Speed" value={c.speed} onChange={(v) => set({ speed: v })} placeholder="30" />
              </div>
              <TitledBox title="Hit Points">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <MiniStat label="Max" value={c.maxHp} onChange={(v) => set({ maxHp: v })} />
                  <MiniStat label="Current" value={c.hp} onChange={(v) => set({ hp: v })} />
                  <MiniStat label="Temp" value={c.tempHp} onChange={(v) => set({ tempHp: v })} />
                </div>
              </TitledBox>
              <div className="grid grid-cols-2 gap-2">
                <TitledBox title="Hit Dice">
                  <Ink value={c.hitDice} onChange={(v) => set({ hitDice: v })} center mono placeholder="5d10" />
                </TitledBox>
                <TitledBox title="Death Saves">
                  <DeathDots label="Successes" n={c.deathSaves.successes} filled="#3f7d4f" onSet={(v) => setDeath('successes', v)} />
                  <DeathDots label="Failures" n={c.deathSaves.failures} filled="#9a3b34" onSet={(v) => setDeath('failures', v)} />
                </TitledBox>
              </div>
              <TitledBox title="Attacks & Spellcasting">
                <AttackTable attacks={c.attacks} editAttack={editAttack} addAttack={addAttack} removeAttack={removeAttack} />
              </TitledBox>
            </div>

            {/* BOTTOM — proficiencies / equipment / features / personality */}
            <TitledBox title="Other Proficiencies & Languages" className="col-span-12 sm:col-span-6">
              <InkArea value={c.proficienciesLanguages} onChange={(v) => set({ proficienciesLanguages: v })} rows={3} />
            </TitledBox>
            <TitledBox title="Equipment" className="col-span-12 sm:col-span-6">
              <InkArea value={c.equipment} onChange={(v) => set({ equipment: v })} rows={3} />
            </TitledBox>

            <div className="col-span-12 grid grid-cols-12 gap-2">
              <div className="col-span-12 space-y-2 sm:col-span-7">
                <TitledBox title="Personality Traits"><InkArea value={c.personalityTraits} onChange={(v) => set({ personalityTraits: v })} rows={2} /></TitledBox>
                <TitledBox title="Ideals"><InkArea value={c.ideals} onChange={(v) => set({ ideals: v })} rows={2} /></TitledBox>
                <TitledBox title="Bonds"><InkArea value={c.bonds} onChange={(v) => set({ bonds: v })} rows={2} /></TitledBox>
                <TitledBox title="Flaws"><InkArea value={c.flaws} onChange={(v) => set({ flaws: v })} rows={2} /></TitledBox>
              </div>
              <TitledBox title="Features & Traits" className="col-span-12 sm:col-span-5">
                <InkArea value={c.features} onChange={(v) => set({ features: v })} rows={12} />
              </TitledBox>
            </div>
          </div>
        )}

        {/* --------------------------------- PAGE 2 --------------------------------- */}
        {page === 1 && (
          <div className="grid grid-cols-12 gap-2">
            <TitledBox title="Character Appearance" className="col-span-12 sm:col-span-7">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <FieldBox label="Age" value={c.age} onChange={(v) => set({ age: v })} />
                <FieldBox label="Height" value={c.height} onChange={(v) => set({ height: v })} />
                <FieldBox label="Weight" value={c.weight} onChange={(v) => set({ weight: v })} />
                <FieldBox label="Eyes" value={c.eyes} onChange={(v) => set({ eyes: v })} />
                <FieldBox label="Skin" value={c.skin} onChange={(v) => set({ skin: v })} />
                <FieldBox label="Hair" value={c.hair} onChange={(v) => set({ hair: v })} />
              </div>
            </TitledBox>
            <TitledBox title="Character Image" className="col-span-12 sm:col-span-5">
              <Portrait c={c} set={set} />
            </TitledBox>

            <TitledBox title="Character Backstory" className="col-span-12">
              <InkArea value={c.backstory} onChange={(v) => set({ backstory: v })} rows={7} placeholder="Where they came from, who they were, what drives them…" />
            </TitledBox>

            <TitledBox title="Allies & Organizations" className="col-span-12 sm:col-span-6">
              <div className="space-y-1.5">
                {c.allies.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1.4fr_14px] items-center gap-1.5">
                    <input value={a.name} onChange={(e) => editAlly(i, { name: e.target.value })} placeholder="Name / faction" className="rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-2 py-1 text-[11px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
                    <input value={a.notes} onChange={(e) => editAlly(i, { notes: e.target.value })} placeholder="Notes / relationship" className="rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-2 py-1 text-[11px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
                    <button onClick={() => removeAlly(i)} className="text-[#9a3b34]/60 hover:text-[#9a3b34]"><X size={11} /></button>
                  </div>
                ))}
                <button onClick={addAlly} className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#c3b285] px-2 py-0.5 text-[10px] text-[#766440] hover:bg-[#fbf6e6]/60"><Plus size={11} /> Add ally / organization</button>
              </div>
            </TitledBox>
            <TitledBox title="Additional Features & Traits" className="col-span-12 sm:col-span-6">
              <InkArea value={c.additionalFeatures} onChange={(v) => set({ additionalFeatures: v })} rows={5} />
            </TitledBox>

            <TitledBox title="Treasure" className="col-span-12">
              <InkArea value={c.treasure} onChange={(v) => set({ treasure: v })} rows={3} placeholder="Coins, gems, magic items…" />
            </TitledBox>
          </div>
        )}

        {/* --------------------------------- PAGE 3 --------------------------------- */}
        {page === 2 && (
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <FieldBox label="Spellcasting Class" value={c.spellClass} onChange={(v) => set({ spellClass: v })} center />
              <FieldBox label="Spellcasting Ability" value={c.spellcastingAbility} onChange={(v) => set({ spellcastingAbility: v })} placeholder="WIS" center />
              <CenterBox label="Spell Save DC" value={c.spellSaveDC} onChange={(v) => set({ spellSaveDC: v })} />
              <CenterBox label="Spell Atk Bonus" value={c.spellAtkBonus} onChange={(v) => set({ spellAtkBonus: v })} />
            </div>

            <SpellBox className="col-span-12 sm:col-span-4" level={0} title="Cantrips" slot={null}
              value={c.cantrips} onChange={(v) => set({ cantrips: v })} placeholder="Sacred Flame, Light, Guidance…" />

            {SPELL_LEVELS.map((lvl) => (
              <SpellBox key={lvl} className="col-span-12 sm:col-span-4" level={lvl} title={`Level ${lvl}`}
                slot={c.spellSlots[lvl] || { total: '', used: '' }}
                onSlot={(patch) => editSlot(lvl, patch)}
                value={c.spellsByLevel[lvl]} onChange={(v) => editSpellLevel(lvl, v)} placeholder={`Level ${lvl} spells…`} />
            ))}

            {c.spells ? (
              <TitledBox title="Other / Unsorted Spells" className="col-span-12">
                <InkArea value={c.spells} onChange={(v) => set({ spells: v })} rows={2} />
              </TitledBox>
            ) : null}
          </div>
        )}
      </div>

      <p className="pt-0.5 text-center text-[9px] text-white/30">
        Page {page + 1} of 3 · modifiers, proficiency bonus, saves &amp; skills computed automatically · every field editable · saved to this campaign
      </p>
    </div>
  )
}

// ---- parchment building blocks ----------------------------------------------

// Bordered box with the uppercase label at the BOTTOM (official-sheet style).
function TitledBox({ title, children, className = '' }) {
  return (
    <div className={`flex flex-col rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 ${className}`}>
      <div className="flex-1 px-2 pt-1.5 pb-1">{children}</div>
      <div className="border-t border-[#9c8a61]/55 py-[3px] text-center text-[8px] font-semibold uppercase tracking-[0.1em] text-[#766440]">{title}</div>
    </div>
  )
}

// Box with label on top — used for the name + header identity fields.
function Box({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col justify-end rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 px-2 pt-1 pb-1 ${className}`}>
      {children}
      <div className="mt-0.5 text-[7.5px] font-semibold uppercase tracking-[0.1em] text-[#766440]">{label}</div>
    </div>
  )
}

function FieldBox({ label, value, onChange, placeholder, center }) {
  return (
    <div className="rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 px-2 pt-1 pb-0.5">
      <Ink value={value} onChange={onChange} placeholder={placeholder} center={center} />
      <div className={`text-[7.5px] font-semibold uppercase tracking-[0.08em] text-[#766440] ${center ? 'text-center' : ''}`}>{label}</div>
    </div>
  )
}

// Big centered value box with the label underneath — AC / Initiative / Speed.
function CenterBox({ label, value, onChange, placeholder }) {
  return (
    <div className="rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 px-1 pt-1.5 pb-1 text-center">
      <input value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-center font-mono text-base text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
      <div className="mt-0.5 text-[7.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-[#766440]">{label}</div>
    </div>
  )
}

function MiniStat({ label, value, onChange }) {
  return (
    <div>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 py-0.5 text-center font-mono text-sm text-[#2c2114] outline-none" />
      <div className="text-[7px] font-semibold uppercase tracking-wide text-[#766440]">{label}</div>
    </div>
  )
}

// Small label-bottom box for Inspiration / Proficiency Bonus.
function PillBox({ label, children }) {
  return (
    <div className="rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 px-1 pt-1.5 pb-1">
      {children}
      <div className="mt-1 text-center text-[7.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-[#766440]">{label}</div>
    </div>
  )
}

// The tall ability-score box: name, big modifier, score pill overlapping the base.
function AbilityBox({ k, mod, score, onScore }) {
  return (
    <div className="relative rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/50 px-1 pt-1.5 pb-4 text-center">
      <div className="text-[8px] font-bold uppercase tracking-wide text-[#766440]">{k}</div>
      <div className="font-mono text-xl font-semibold leading-tight text-[#2c2114]">{fmtMod(mod)}</div>
      <input value={score ?? ''} onChange={(e) => onScore(e.target.value)} className="absolute -bottom-2.5 left-1/2 h-5 w-9 -translate-x-1/2 rounded-full border-[1.5px] border-[#9c8a61] bg-[#f4ecd5] text-center font-mono text-[11px] text-[#2c2114] outline-none" />
    </div>
  )
}

// Proficiency dot + modifier + label — saving throws (0/1) and skills (0/1/2).
function ProfRow({ level, onToggle, total, label, sub }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-1.5 rounded px-0.5 py-[1px] text-left transition hover:bg-[#e7d9b4]/40">
      <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#6f6044]" style={{ background: level >= 1 ? '#6f6044' : 'transparent' }}>
        {level === 2 ? <span className="text-[6px] leading-none text-[#f4ecd5]">★</span> : null}
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[11px] text-[#2c2114]">{fmtMod(total)}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-[#3a2f1f]">{label}{sub ? <span className="text-[#9a865c]"> ({sub})</span> : null}</span>
    </button>
  )
}

function DeathDots({ label, n, filled, onSet }) {
  return (
    <div className="flex items-center gap-1.5 py-px">
      <span className="w-12 shrink-0 text-[7px] font-semibold uppercase tracking-wide text-[#766440]">{label}</span>
      {[1, 2, 3].map((i) => (
        <button key={i} onClick={() => onSet(n >= i ? i - 1 : i)} className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#6f6044]" style={{ background: n >= i ? filled : 'transparent' }} />
      ))}
    </div>
  )
}

function AttackTable({ attacks, editAttack, addAttack, removeAttack }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_38px_1fr_14px] gap-1 px-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#766440]">
        <span>Name</span><span className="text-center">Atk</span><span>Damage / Type</span><span />
      </div>
      {attacks.map((a, i) => (
        <div key={i} className="grid grid-cols-[1fr_38px_1fr_14px] items-center gap-1">
          <input value={a.name} onChange={(e) => editAttack(i, { name: e.target.value })} placeholder="Longsword" className="rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-1.5 py-0.5 text-[11px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
          <input value={a.atk} onChange={(e) => editAttack(i, { atk: e.target.value })} placeholder="+7" className="rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-0.5 py-0.5 text-center text-[11px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
          <input value={a.damage} onChange={(e) => editAttack(i, { damage: e.target.value })} placeholder="1d8+4 slashing" className="rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-1.5 py-0.5 text-[11px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
          <button onClick={() => removeAttack(i)} className="text-[#9a3b34]/60 hover:text-[#9a3b34]"><X size={11} /></button>
        </div>
      ))}
      <button onClick={addAttack} className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#c3b285] px-2 py-0.5 text-[10px] text-[#766440] hover:bg-[#fbf6e6]/60"><Plus size={11} /> Add attack</button>
    </div>
  )
}

// A spell-level cell: header with the level name + total/expended slot boxes,
// then the list of spells for that level. Cantrips pass slot={null}.
function SpellBox({ level, title, slot, onSlot, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col rounded-md border-[1.5px] border-[#9c8a61] bg-[#fbf6e6]/40 ${className}`}>
      <div className="flex items-center justify-between gap-1 border-b border-[#9c8a61]/55 px-2 py-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[#9c8a61] bg-[#f4ecd5] font-mono text-[11px] font-semibold text-[#2c2114]">{level}</span>
        <span className="flex-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#766440]">{title}</span>
        {slot ? (
          <span className="flex items-center gap-1">
            <input value={slot.total ?? ''} onChange={(e) => onSlot({ total: e.target.value })} title="Total slots" className="h-5 w-6 rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 text-center font-mono text-[10px] text-[#2c2114] outline-none" />
            <span className="text-[8px] text-[#9a865c]">/</span>
            <input value={slot.used ?? ''} onChange={(e) => onSlot({ used: e.target.value })} title="Expended" className="h-5 w-6 rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 text-center font-mono text-[10px] text-[#2c2114] outline-none" />
          </span>
        ) : null}
      </div>
      <textarea rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="m-1 resize-none bg-transparent px-1 text-[11px] leading-snug text-[#2c2114] outline-none placeholder:italic placeholder:text-[#a8966a]" />
    </div>
  )
}

function Portrait({ c, set }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded border-[1.5px] border-[#c3b285] bg-[#f4ecd5]">
        {c.portrait ? (
          <img src={c.portrait} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <span className="font-display text-3xl text-[#9c8a61]">{(c.name || '?').trim().charAt(0).toUpperCase()}</span>
        )}
      </div>
      <input value={c.portrait} onChange={(e) => set({ portrait: e.target.value })} placeholder="paste image URL…" className="w-full rounded border-[1.5px] border-[#c3b285] bg-[#fbf6e6]/60 px-1.5 py-0.5 text-[9px] text-[#2c2114] outline-none placeholder:text-[#a8966a]" />
    </div>
  )
}

// Transparent ink input on the parchment.
function Ink({ value, onChange, placeholder, center, mono, big, className = '' }) {
  return (
    <input
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent text-[#2c2114] outline-none placeholder:text-[#a8966a] ${center ? 'text-center' : ''} ${mono ? 'font-mono' : ''} ${big ? 'text-base' : 'text-[12px]'} ${className}`}
    />
  )
}

// Transparent ink textarea on the parchment.
function InkArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      rows={rows}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none bg-transparent text-[11px] leading-snug text-[#2c2114] outline-none placeholder:italic placeholder:text-[#a8966a]"
    />
  )
}
