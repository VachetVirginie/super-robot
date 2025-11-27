
// =============================================================
// TYPES
// =============================================================

export type WorkoutKind = 'cardio' | 'strength' | 'mobility' | 'mixed'

export type ExerciseCategory = 'cardio' | 'strength' | 'mobility'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  targets: string[]
  level: 1 | 2 | 3
  description: string
  cues: string[]
  easierVariation?: string
  hasAnimation?: boolean
  mediaType?: 'gif' | 'lottie' | 'video'
  mediaUrl?: string
}

export interface WorkoutTemplateBlock {
  type: 'warmup' | 'main' | 'cooldown'
  durationSeconds: number
  exerciseIds: string[]
}

export interface WorkoutTemplate {
  key: string
  name: string
  kind: WorkoutKind
  level: 1 | 2 | 3
  targetDurationMinutes: 5 | 10 | 15 | 20 | 30
  blocks: WorkoutTemplateBlock[]
}

// =============================================================
// CATALOGUE EXERCICES — COMPLET (EXISTANTS + NOUVEAUX)
// =============================================================

export const EXERCISES: Exercise[] = [

  // ---------------------------------------------------------
  // CARDIO — EXISTANTS
  // ---------------------------------------------------------
  {
    id: 'EXO_CARDIO_MARCHE_PLACE',
    name: 'Marche sur place dynamique',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description: "Leve les genoux alternativement en balançant légèrement les bras.",
    cues: ['Pose les pieds en douceur', 'Garde les épaules relâchées'],
    easierVariation: 'Marche plus lente.',
  },
  {
    id: 'EXO_CARDIO_STEP_TOUCH',
    name: 'Pas cote à cote',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description: "Pas latéral puis retour au centre.",
    cues: ['Genoux souples'],
  },
  {
    id: 'EXO_CARDIO_MARCHE_FRONTALE',
    name: 'Marche avant/arrière',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description: "2–3 pas avant puis arrière.",
    cues: ['Regarde devant toi'],
  },
  {
    id: 'EXO_CARDIO_JJ_LOW_IMPACT',
    name: 'Jumping jack sans saut',
    category: 'cardio',
    targets: ['jambes', 'epaules'],
    level: 2,
    description: "Jambe droite, bras ouvers, puis inverse.",
    cues: ['Mouvement contrôlé'],
  },

  // ---------------------------------------------------------
  // RENFO — EXISTANTS
  // ---------------------------------------------------------
  {
    id: 'EXO_SQUAT_CHAISE',
    name: 'Squat vers chaise',
    category: 'strength',
    targets: ['jambes', 'fessiers'],
    level: 1,
    description: "Descends vers la chaise puis remonte.",
    cues: ['Genoux alignés', 'Poitrine ouverte'],
  },
  {
    id: 'EXO_PONT_FESSIER',
    name: 'Pont fessier',
    category: 'strength',
    targets: ['fessiers'],
    level: 1,
    description: "Monte le bassin en serrant les fessiers.",
    cues: ['Pousse dans les talons'],
  },
  {
    id: 'EXO_POMPE_MUR',
    name: 'Pompes au mur',
    category: 'strength',
    targets: ['pectoraux', 'bras'],
    level: 1,
    description: "Flechis les coudes vers le mur et repousse.",
    cues: ['Corps gainé'],
  },
  {
    id: 'EXO_GAINAGE_GENOUX',
    name: 'Gainage sur genoux',
    category: 'strength',
    targets: ['abdos', 'dos'],
    level: 1,
    description: "Tiens la position alignée.",
    cues: ['Regarde le sol'],
  },

  // ---------------------------------------------------------
  // MOBILITÉ — EXISTANTS
  // ---------------------------------------------------------
  {
    id: 'EXO_MOB_COUP_DEBOUT',
    name: 'Mobilité nuque/épaules',
    category: 'mobility',
    targets: ['nuque', 'epaules'],
    level: 1,
    description: "Cercles d’épaules et inclinaisons de tête.",
    cues: ['Mouvement doux'],
  },
  {
    id: 'EXO_MOB_COLONNE_CHAT_VACHE',
    name: 'Chat/vache debout',
    category: 'mobility',
    targets: ['dos'],
    level: 1,
    description: "Alterne dos rond / dos creux.",
    cues: ['Ne force pas'],
  },
  {
    id: 'EXO_MOB_HANCHES',
    name: 'Cercles de hanches',
    category: 'mobility',
    targets: ['hanches'],
    level: 1,
    description: "Rotation lente du bassin.",
    cues: ['Amplitude confortable'],
  },
  {
    id: 'EXO_ETIREMENT_ISCHIOS_MUR',
    name: 'Étirement ischios debout',
    category: 'mobility',
    targets: ['ischios'],
    level: 1,
    description: "Talons sur un support, buste vers l’avant.",
    cues: ['Dos long'],
  },

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // 🔥 NOUVEAUX EXERCICES — AJOUT COMPLET
  // ---------------------------------------------------------
  // ---------------------------------------------------------

  // --- Cardio nouveaux ---
  {
    id: 'EXO_CARDIO_TALONS_FESSES',
    name: 'Talons-fesses sur place',
    category: 'cardio',
    targets: ['jambes'],
    level: 1,
    description: "Ramène un talon vers les fesses en alternance.",
    cues: ['Dos droit'],
  },
  {
    id: 'EXO_CARDIO_KNEE_LIFT',
    name: 'Montées de genoux low impact',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description: "Monte les genoux et bouge les bras.",
    cues: ['Respiration fluide'],
  },
  {
    id: 'EXO_CARDIO_PAS_ARC_COURBE',
    name: 'Pas en arc de cercle',
    category: 'cardio',
    targets: ['jambes', 'coordination'],
    level: 1,
    description: "Déplacement latéral semi-circulaire.",
    cues: ['Transfert de poids fluide'],
  },
  {
    id: 'EXO_CARDIO_BOX_JABS',
    name: 'Jabs boxe',
    category: 'cardio',
    targets: ['epaules', 'bras'],
    level: 1,
    description: "Poings vers l’avant en alternance.",
    cues: ['Gaine légère'],
  },
  {
    id: 'EXO_CARDIO_SIDE_KICKS',
    name: 'Side kicks doux',
    category: 'cardio',
    targets: ['jambes'],
    level: 1,
    description: "Petit coup de pied latéral contrôlé.",
    cues: ['Ne force pas la hauteur'],
  },
  {
    id: 'EXO_CARDIO_DOUBLE_STEP',
    name: 'Double step lateral',
    category: 'cardio',
    targets: ['jambes'],
    level: 1,
    description: "Deux pas droite, deux pas gauche.",
    cues: ['Genoux souples'],
  },
  {
    id: 'EXO_CARDIO_STEP_BACK',
    name: 'Pas arrière alterné',
    category: 'cardio',
    targets: ['jambes'],
    level: 1,
    description: "Reculer une jambe puis l’autre.",
    cues: ['Pose complète du pied'],
  },

  // --- Renforcement nouveaux ---
  {
    id: 'EXO_SQUAT_DEMI',
    name: 'Demi-squat',
    category: 'strength',
    targets: ['jambes'],
    level: 1,
    description: "Mini-squat contrôlé.",
    cues: ['Poids dans les talons'],
  },
  {
    id: 'EXO_FENTE_STATIQUE',
    name: 'Fente statique',
    category: 'strength',
    targets: ['jambes'],
    level: 1,
    description: "Fente fixe, amplitude courte.",
    cues: ['Bassin centré'],
  },
  {
    id: 'EXO_ROW_BAND_IMAGINARY',
    name: 'Tirage bras imaginaire',
    category: 'strength',
    targets: ['dos', 'bras'],
    level: 1,
    description: "Ramène les coudes vers l’arrière.",
    cues: ['Omoplates serrées'],
  },
  {
    id: 'EXO_PUSH_UP_TABLE',
    name: 'Pompes contre table',
    category: 'strength',
    targets: ['pectoraux', 'bras'],
    level: 1,
    description: "Inclinaison faible, bras fléchis.",
    cues: ['Coude 45°'],
  },
  {
    id: 'EXO_CHAIR_SIT_HOLD',
    name: 'Chaise murale semi',
    category: 'strength',
    targets: ['jambes'],
    level: 2,
    description: "Position chaise peu profonde.",
    cues: ['Genoux au-dessus des chevilles'],
  },
  {
    id: 'EXO_GLUTE_KICKBACK',
    name: 'Kick arrière debout',
    category: 'strength',
    targets: ['fessiers'],
    level: 1,
    description: "Tends la jambe vers l’arrière.",
    cues: ['Mouvement lent'],
  },
  {
    id: 'EXO_ABS_STANDING_CRUNCH',
    name: 'Crunch debout',
    category: 'strength',
    targets: ['abdos'],
    level: 1,
    description: "Genou vers les coudes.",
    cues: ['Souffle à la montée'],
  },

  // --- Mobilité nouveaux ---
  {
    id: 'EXO_MOB_ANKLES',
    name: 'Cercles de chevilles',
    category: 'mobility',
    targets: ['chevilles'],
    level: 1,
    description: "Rotation douce de la cheville.",
    cues: ['Amplitude douce'],
  },
  {
    id: 'EXO_MOB_POIGNETS',
    name: 'Cercles de poignets',
    category: 'mobility',
    targets: ['poignets'],
    level: 1,
    description: "Mobilisation lente.",
    cues: ['Respiration calme'],
  },
  {
    id: 'EXO_MOB_HANCHE_OUVERTURE',
    name: 'Ouverture de hanche',
    category: 'mobility',
    targets: ['hanches'],
    level: 1,
    description: "Monte un genou et ouvre vers l’extérieur.",
    cues: ['Contrôle'],
  },
  {
    id: 'EXO_ETIREMENT_QUADRICEPS',
    name: 'Étirement quadriceps debout',
    category: 'mobility',
    targets: ['quadriceps'],
    level: 1,
    description: "Tire le pied vers les fesses.",
    cues: ['Genou vers le sol'],
  },
  {
    id: 'EXO_ETIREMENT_TRICEPS',
    name: 'Étirement triceps',
    category: 'mobility',
    targets: ['bras'],
    level: 1,
    description: "Main derrière la tête.",
    cues: ['Épaule relâchée'],
  },
  {
    id: 'EXO_MOB_TWIST_DEBOUT',
    name: 'Rotation douce du buste',
    category: 'mobility',
    targets: ['dos'],
    level: 1,
    description: "Tourne doucement droite/gauche.",
    cues: ['Hanches fixes'],
  },
]





// =============================================================
// =============================================================
// 🧩 WORKOUT TEMPLATES — COMPLET (EXISTANTS + 20 NOUVEAUX)
// =============================================================
// =============================================================

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [

  // ---------------------------------------------------------
  // TEMPLATES D'ORIGINE
  // ---------------------------------------------------------

  {
    key: 'WT_MOB_5_MIN_EASY',
    name: 'Reveil doux (mobilite 5 min)',
    kind: 'mobility',
    level: 1,
    targetDurationMinutes: 5,
    blocks: [
      { type: 'warmup', durationSeconds: 60, exerciseIds: ['EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 60, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
      { type: 'main', durationSeconds: 60, exerciseIds: ['EXO_MOB_HANCHES'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE'] },
    ],
  },

  {
    key: 'WT_CARDIO_10_MIN_BEGINNER',
    name: 'Cardio doux 10 min',
    kind: 'cardio',
    level: 1,
    targetDurationMinutes: 10,
    blocks: [
      { type: 'warmup', durationSeconds: 120, exerciseIds: ['EXO_MOB_COUP_DEBOUT', 'EXO_MOB_HANCHES'] },
      { type: 'main', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE', 'EXO_CARDIO_STEP_TOUCH', 'EXO_CARDIO_MARCHE_FRONTALE'] },
      { type: 'main', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE', 'EXO_CARDIO_STEP_TOUCH', 'EXO_CARDIO_JJ_LOW_IMPACT'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_FULLBODY_15_MIN_BEGINNER',
    name: 'Full body 15 min (debutant)',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 15,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_COLONNE_CHAT_VACHE','EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_PONT_FESSIER','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_PONT_FESSIER','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_MOB_HANCHES','EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_MIX_20_MIN_BEGINNER',
    name: 'Mix renfo + cardio 20 min',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 20,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_COLONNE_CHAT_VACHE','EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_CARDIO_STEP_TOUCH','EXO_PONT_FESSIER','EXO_CARDIO_MARCHE_FRONTALE','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_CARDIO_STEP_TOUCH','EXO_PONT_FESSIER','EXO_CARDIO_JJ_LOW_IMPACT','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'cooldown', durationSeconds: 180, exerciseIds: ['EXO_MOB_HANCHES','EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_FULLBODY_30_MIN_BASE',
    name: 'Full body 30 min (base)',
    kind: 'mixed',
    level: 2,
    targetDurationMinutes: 30,
    blocks: [
      { type: 'warmup', durationSeconds: 240, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_COLONNE_CHAT_VACHE','EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_CARDIO_STEP_TOUCH','EXO_PONT_FESSIER','EXO_CARDIO_MARCHE_FRONTALE','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_CARDIO_STEP_TOUCH','EXO_PONT_FESSIER','EXO_CARDIO_JJ_LOW_IMPACT','EXO_POMPE_MUR','EXO_GAINAGE_GENOUX'] },
      { type: 'cooldown', durationSeconds: 300, exerciseIds: ['EXO_MOB_HANCHES','EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },


  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // 🆕 NOUVEAUX WORKOUTS — 20 SÉANCES PROGRESSION N1→N3
  // ---------------------------------------------------------
  // ---------------------------------------------------------

  // ==============================================================  
  // 5 minutes — 4 templates (N1 → N2)
  // ==============================================================

  {
    key: 'WT_5_MIN_N1_MOB_CARDIO',
    name: 'Échauffement doux 5 min (N1)',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 5,
    blocks: [
      { type: 'warmup', durationSeconds: 60, exerciseIds: ['EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_MOB_HANCHES'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_5_MIN_N1_LOWER',
    name: 'Renfo bas du corps 5 min (N1)',
    kind: 'strength',
    level: 1,
    targetDurationMinutes: 5,
    blocks: [
      { type: 'warmup', durationSeconds: 60, exerciseIds: ['EXO_MOB_HANCHES'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_SQUAT_CHAISE'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_PONT_FESSIER'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_ETIREMENT_QUADRICEPS'] },
    ],
  },

  {
    key: 'WT_5_MIN_N2_CARDIO',
    name: 'Cardio léger 5 min (N2)',
    kind: 'cardio',
    level: 2,
    targetDurationMinutes: 5,
    blocks: [
      { type: 'warmup', durationSeconds: 60, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_CARDIO_STEP_TOUCH','EXO_CARDIO_KNEE_LIFT'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_CARDIO_TALONS_FESSES'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_5_MIN_N2_UPPER',
    name: 'Renfo haut du corps 5 min (N2)',
    kind: 'strength',
    level: 2,
    targetDurationMinutes: 5,
    blocks: [
      { type: 'warmup', durationSeconds: 60, exerciseIds: ['EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_PUSH_UP_TABLE'] },
      { type: 'main', durationSeconds: 120, exerciseIds: ['EXO_ROW_BAND_IMAGINARY'] },
      { type: 'cooldown', durationSeconds: 60, exerciseIds: ['EXO_ETIREMENT_TRICEPS'] },
    ],
  },  


  // ==============================================================  
  // 10 minutes — 4 templates (N1 → N2 → N3)
  // ==============================================================

  {
    key: 'WT_10_MIN_N1_CARDIO',
    name: 'Cardio débutant 10 min (N1)',
    kind: 'cardio',
    level: 1,
    targetDurationMinutes: 10,
    blocks: [
      { type: 'warmup', durationSeconds: 120, exerciseIds: ['EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_CARDIO_STEP_TOUCH'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_MARCHE_FRONTALE'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_10_MIN_N2_FULLBODY',
    name: 'Full body dynamique 10 min (N2)',
    kind: 'mixed',
    level: 2,
    targetDurationMinutes: 10,
    blocks: [
      { type: 'warmup', durationSeconds: 120, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_HANCHE_OUVERTURE'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_SQUAT_DEMI','EXO_PUSH_UP_TABLE','EXO_ABS_STANDING_CRUNCH'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_GLUTE_KICKBACK','EXO_ROW_BAND_IMAGINARY'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_10_MIN_N3_CARDIO',
    name: 'Cardio modéré 10 min (N3)',
    kind: 'cardio',
    level: 3,
    targetDurationMinutes: 10,
    blocks: [
      { type: 'warmup', durationSeconds: 120, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_KNEE_LIFT','EXO_CARDIO_BOX_JABS','EXO_CARDIO_SIDE_KICKS'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_DOUBLE_STEP','EXO_CARDIO_TALONS_FESSES'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_MOB_TWIST_DEBOUT'] },
    ],
  },

  {
    key: 'WT_10_MIN_N3_STRENGTH',
    name: 'Renfo tonique 10 min (N3)',
    kind: 'strength',
    level: 3,
    targetDurationMinutes: 10,
    blocks: [
      { type: 'warmup', durationSeconds: 120, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_HANCHES'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_FENTE_STATIQUE','EXO_CHAIR_SIT_HOLD'] },
      { type: 'main', durationSeconds: 240, exerciseIds: ['EXO_PUSH_UP_TABLE','EXO_GAINAGE_GENOUX'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_ETIREMENT_QUADRICEPS'] },
    ],
  },


  // ==============================================================  
  // 15 minutes — 4 templates (N1 → N2 → N3)
  // ==============================================================

  {
    key: 'WT_15_MIN_N1_MOBILITY',
    name: 'Mobilité profonde 15 min (N1)',
    kind: 'mobility',
    level: 1,
    targetDurationMinutes: 15,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_POIGNETS'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE','EXO_MOB_HANCHES','EXO_MOB_ANKLES'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_MOB_HANCHE_OUVERTURE','EXO_MOB_TWIST_DEBOUT'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_15_MIN_N2_CARDIO_MIX',
    name: 'Cardio mix 15 min (N2)',
    kind: 'cardio',
    level: 2,
    targetDurationMinutes: 15,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_HANCHE_OUVERTURE'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_CARDIO_STEP_TOUCH','EXO_CARDIO_KNEE_LIFT','EXO_CARDIO_DOUBLE_STEP'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_CARDIO_SIDE_KICKS','EXO_CARDIO_BOX_JABS'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_15_MIN_N3_FULLBODY',
    name: 'Full body tonique 15 min (N3)',
    kind: 'mixed',
    level: 3,
    targetDurationMinutes: 15,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_SQUAT_DEMI','EXO_PUSH_UP_TABLE','EXO_ABS_STANDING_CRUNCH'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_GLUTE_KICKBACK','EXO_ROW_BAND_IMAGINARY','EXO_CHAIR_SIT_HOLD'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_ETIREMENT_TRICEPS'] },
    ],
  },

  {
    key: 'WT_15_MIN_N3_LOWER',
    name: 'Bas du corps intense 15 min (N3)',
    kind: 'strength',
    level: 3,
    targetDurationMinutes: 15,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_HANCHES','EXO_MOB_ANKLES'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_SQUAT_DEMI','EXO_FENTE_STATIQUE','EXO_CHAIR_SIT_HOLD'] },
      { type: 'main', durationSeconds: 360, exerciseIds: ['EXO_PONT_FESSIER','EXO_GLUTE_KICKBACK'] },
      { type: 'cooldown', durationSeconds: 120, exerciseIds: ['EXO_ETIREMENT_QUADRICEPS'] },
    ],
  },


  // ==============================================================  
  // 20 minutes — 4 templates (progression complète)
  // ==============================================================

  {
    key: 'WT_20_MIN_N1_STRETCH',
    name: 'Étirements & mobilité 20 min (N1)',
    kind: 'mobility',
    level: 1,
    targetDurationMinutes: 20,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_MOB_POIGNETS'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE','EXO_MOB_HANCHE_OUVERTURE','EXO_MOB_TWIST_DEBOUT'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR','EXO_ETIREMENT_QUADRICEPS','EXO_ETIREMENT_TRICEPS'] },
      { type: 'cooldown', durationSeconds: 180, exerciseIds: ['EXO_MOB_ANKLES'] },
    ],
  },

  {
    key: 'WT_20_MIN_N2_MIX',
    name: 'Mix renfo/cardio 20 min (N2)',
    kind: 'mixed',
    level: 2,
    targetDurationMinutes: 20,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_HANCHES'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_CARDIO_STEP_TOUCH','EXO_CARDIO_KNEE_LIFT','EXO_SQUAT_DEMI','EXO_PUSH_UP_TABLE'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_CARDIO_DOUBLE_STEP','EXO_CARDIO_BOX_JABS','EXO_GLUTE_KICKBACK'] },
      { type: 'cooldown', durationSeconds: 180, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'] },
    ],
  },

  {
    key: 'WT_20_MIN_N3_CARDIO',
    name: 'Cardio modéré + tonique 20 min (N3)',
    kind: 'cardio',
    level: 3,
    targetDurationMinutes: 20,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_HANCHES'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_CARDIO_KNEE_LIFT','EXO_CARDIO_BOX_JABS','EXO_CARDIO_SIDE_KICKS'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_CARDIO_DOUBLE_STEP','EXO_CARDIO_TALONS_FESSES','EXO_CARDIO_PAS_ARC_COURBE'] },
      { type: 'cooldown', durationSeconds: 180, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_20_MIN_N3_FULLBODY',
    name: 'Full body tonique 20 min (N3)',
    kind: 'mixed',
    level: 3,
    targetDurationMinutes: 20,
    blocks: [
      { type: 'warmup', durationSeconds: 180, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_SQUAT_DEMI','EXO_PUSH_UP_TABLE','EXO_ABS_STANDING_CRUNCH'] },
      { type: 'main', durationSeconds: 420, exerciseIds: ['EXO_GLUTE_KICKBACK','EXO_ROW_BAND_IMAGINARY','EXO_CHAIR_SIT_HOLD'] },
      { type: 'cooldown', durationSeconds: 180, exerciseIds: ['EXO_ETIREMENT_TRICEPS'] },
    ],
  },


  // ==============================================================  
  // 30 minutes — 4 templates (N1 → N2 → N3 progression complète)
  // ==============================================================

  {
    key: 'WT_30_MIN_N1_FULLBODY',
    name: 'Full body facile 30 min (N1)',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 30,
    blocks: [
      { type: 'warmup', durationSeconds: 240, exerciseIds: ['EXO_MOB_COUP_DEBOUT','EXO_CARDIO_MARCHE_PLACE'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_SQUAT_CHAISE','EXO_PONT_FESSIER','EXO_PUSH_UP_TABLE'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_CARDIO_STEP_TOUCH','EXO_CARDIO_MARCHE_FRONTALE','EXO_GLUTE_KICKBACK'] },
      { type: 'cooldown', durationSeconds: 300, exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR','EXO_MOB_TWIST_DEBOUT'] },
    ],
  },

  {
    key: 'WT_30_MIN_N2_CARDIO_MIX',
    name: 'Cardio mix 30 min (N2)',
    kind: 'cardio',
    level: 2,
    targetDurationMinutes: 30,
    blocks: [
      { type: 'warmup', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_HANCHE_OUVERTURE'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_CARDIO_STEP_TOUCH','EXO_CARDIO_KNEE_LIFT','EXO_CARDIO_DOUBLE_STEP'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_CARDIO_SIDE_KICKS','EXO_CARDIO_BOX_JABS','EXO_CARDIO_TALONS_FESSES'] },
      { type: 'cooldown', durationSeconds: 300, exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'] },
    ],
  },

  {
    key: 'WT_30_MIN_N3_STRENGTH',
    name: 'Renfo avancé 30 min (N3)',
    kind: 'strength',
    level: 3,
    targetDurationMinutes: 30,
    blocks: [
      { type: 'warmup', durationSeconds: 240, exerciseIds: ['EXO_MOB_HANCHES','EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_SQUAT_DEMI','EXO_FENTE_STATIQUE','EXO_CHAIR_SIT_HOLD'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_PUSH_UP_TABLE','EXO_ROW_BAND_IMAGINARY','EXO_GAINAGE_GENOUX'] },
      { type: 'cooldown', durationSeconds: 300, exerciseIds: ['EXO_ETIREMENT_QUADRICEPS'] },
    ],
  },

  {
    key: 'WT_30_MIN_N3_FULLBODY',
    name: 'Full body tonique 30 min (N3)',
    kind: 'mixed',
    level: 3,
    targetDurationMinutes: 30,
    blocks: [
      { type: 'warmup', durationSeconds: 240, exerciseIds: ['EXO_CARDIO_MARCHE_PLACE','EXO_MOB_COUP_DEBOUT'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_SQUAT_DEMI','EXO_PUSH_UP_TABLE','EXO_ABS_STANDING_CRUNCH'] },
      { type: 'main', durationSeconds: 480, exerciseIds: ['EXO_CARDIO_KNEE_LIFT','EXO_CARDIO_BOX_JABS','EXO_GLUTE_KICKBACK'] },
      { type: 'cooldown', durationSeconds: 300, exerciseIds: ['EXO_ETIREMENT_TRICEPS','EXO_MOB_TWIST_DEBOUT'] },
    ],
  },

]




// =============================================================
// SÉLECTION DE TEMPLATE
// =============================================================

export interface PickWorkoutOptions {
  desiredDurationMinutes: 5 | 10 | 15 | 20 | 30
  preferredKind?: WorkoutKind
  maxLevel?: 1 | 2 | 3
}

export function pickWorkoutTemplate(options: PickWorkoutOptions): WorkoutTemplate | null {
  const { desiredDurationMinutes, preferredKind, maxLevel = 2 } = options

  let candidates = WORKOUT_TEMPLATES.filter(tpl =>
    tpl.targetDurationMinutes === desiredDurationMinutes &&
    tpl.level <= maxLevel &&
    (!preferredKind || tpl.kind === preferredKind)
  )

  if (!candidates.length) {
    candidates = WORKOUT_TEMPLATES.filter(
      tpl => tpl.targetDurationMinutes === desiredDurationMinutes && tpl.level <= maxLevel
    )
  }

  if (!candidates.length) return null

    const index = Math.floor(Math.random() * candidates.length)
  return candidates[index]!
}

