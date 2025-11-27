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

// --- Catalogue d'exercices de base (sans materiel) ---

export const EXERCISES: Exercise[] = [
  // Cardio leger
  {
    id: 'EXO_CARDIO_MARCHE_PLACE',
    name: 'Marche sur place dynamique',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description:
      "Debout, pieds largeur de hanches, leve les genoux alternativement en balancant legerement les bras. Garde le buste droit et regarde devant toi.",
    cues: ['Pose les pieds en douceur', 'Garde les epaules relachees'],
    easierVariation: 'Marche plus lente avec une amplitude de genoux plus petite.',
  },
  {
    id: 'EXO_CARDIO_STEP_TOUCH',
    name: 'Pas cote a cote',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description:
      "Depuis la position debout, fais un pas sur le cote avec le pied droit puis ramene le pied gauche. Alterne droite/gauche en balancant legerement les bras.",
    cues: ['Genoux souples', 'Mouvement fluide, sans saut'],
    easierVariation: 'Reduis la taille des pas et garde les bras proches du corps.',
  },
  {
    id: 'EXO_CARDIO_MARCHE_FRONTALE',
    name: 'Marche avant / arriere',
    category: 'cardio',
    targets: ['jambes', 'cardio'],
    level: 1,
    description:
      "Dans un petit espace, fais 2 a 3 pas vers l'avant puis 2 a 3 pas vers l'arriere, en continu, comme dans un couloir.",
    cues: ['Regarde devant toi', 'Pose tout le pied au sol'],
    easierVariation: 'Reduis a 1 pas avant / 1 pas arriere si besoin.',
  },
  {
    id: 'EXO_CARDIO_JJ_LOW_IMPACT',
    name: 'Jumping jack sans saut',
    category: 'cardio',
    targets: ['jambes', 'epaules', 'cardio'],
    level: 2,
    description:
      "Depuis la position debout, ecarte un pied sur le cote et ouvre les bras, puis reviens au centre et change de cote, sans sauter.",
    cues: ['Mouvement controle', 'Reste leger sur les appuis'],
    easierVariation: "Reduis l'amplitude des bras et le rythme si besoin.",
  },

  // Renforcement
  {
    id: 'EXO_SQUAT_CHAISE',
    name: 'Squat vers chaise',
    category: 'strength',
    targets: ['jambes', 'fessiers'],
    level: 1,
    description:
      "Debout devant une chaise, pieds largeur des epaules, descends comme pour t'asseoir puis remonte en controlant le mouvement.",
    cues: ['Genoux dans laxe des pieds', 'Garde la poitrine ouverte'],
    easierVariation: 'Assieds-toi completement a chaque repetition puis releve-toi.',
  },
  {
    id: 'EXO_PONT_FESSIER',
    name: 'Pont fessier au sol',
    category: 'strength',
    targets: ['fessiers', 'arriere cuisses', 'bas du dos'],
    level: 1,
    description:
      "Allongee sur le dos, pieds proches des fesses, pousse le bassin vers le haut en serrant les fessiers, puis redescends lentement.",
    cues: ['Pousse dans les talons', 'Ne cambre pas exagere le bas du dos'],
    easierVariation: 'Monte moins haut et marque une petite pause en bas.',
  },
  {
    id: 'EXO_POMPE_MUR',
    name: 'Pompes au mur',
    category: 'strength',
    targets: ['pectoraux', 'epaules', 'bras'],
    level: 1,
    description:
      "Place tes mains a plat sur un mur, corps legerement incline, flechis les coudes pour rapprocher la poitrine du mur puis repousse.",
    cues: ['Corps gaine', 'Coudes ni trop serres ni trop ouverts'],
    easierVariation: 'Rapproche les pieds du mur pour reduire linclinaison.',
  },
  {
    id: 'EXO_GAINAGE_GENOUX',
    name: 'Gainage sur genoux',
    category: 'strength',
    targets: ['ceinture abdominale', 'dos'],
    level: 1,
    description:
      "En appui sur les avant-bras et les genoux, garde le corps aligne des epaules aux genoux et tiens la position sans bouger.",
    cues: ['Regarde le sol', 'Rentre legerement le nombril'],
    easierVariation: 'Tiens 10 a 15 secondes, relache, puis recommence.',
  },

  // Mobilite / etirements
  {
    id: 'EXO_MOB_COUP_DEBOUT',
    name: 'Mobilite nuque / epaules',
    category: 'mobility',
    targets: ['nuque', 'epaules'],
    level: 1,
    description:
      "Debout ou assise, fais des cercles lents avec les epaules puis des inclinaisons douces de la tete a droite et a gauche.",
    cues: ['Mouvement confortable', 'Respiration lente et reguliere'],
  },
  {
    id: 'EXO_MOB_COLONNE_CHAT_VACHE',
    name: 'Chat / vache debout contre table',
    category: 'mobility',
    targets: ['dos'],
    level: 1,
    description:
      "Mains posees sur une table, arrondis doucement le dos puis creuse legerement en suivant ta respiration.",
    cues: ['Mouvement fluide', 'Ne force jamais dans la douleur'],
  },
  {
    id: 'EXO_MOB_HANCHES',
    name: 'Cercles de hanches',
    category: 'mobility',
    targets: ['hanches', 'bassin'],
    level: 1,
    description:
      "Pieds bien ancrees, mains sur les hanches, fais des cercles lents avec le bassin dans un sens puis dans lautre.",
    cues: ['Poids reparti sur les deux pieds', 'Amplitude confortable'],
  },
  {
    id: 'EXO_ETIREMENT_ISCHIOS_MUR',
    name: 'Etirement arriere cuisses (debout)',
    category: 'mobility',
    targets: ['ischios', 'jambes'],
    level: 1,
    description:
      "Place un talon sur une chaise ou une marche, jambe quasi tendue, penche legerement le buste vers lavant jusqua sentir letirement a larriere de la cuisse.",
    cues: ['Dos long', "Ne cherche pas a toucher le pied si ton dos sarrondit"],
    easierVariation: 'Choisis un support plus bas pour reduire lamplitude.',
  },
]

// --- Templates de seances ---

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    key: 'WT_MOB_5_MIN_EASY',
    name: 'Reveil doux (mobilite 5 min)',
    kind: 'mobility',
    level: 1,
    targetDurationMinutes: 5,
    blocks: [
      {
        type: 'warmup',
        durationSeconds: 60,
        exerciseIds: ['EXO_MOB_COUP_DEBOUT'],
      },
      {
        type: 'main',
        durationSeconds: 60,
        exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'],
      },
      {
        type: 'main',
        durationSeconds: 60,
        exerciseIds: ['EXO_MOB_HANCHES'],
      },
      {
        type: 'cooldown',
        durationSeconds: 60,
        exerciseIds: ['EXO_ETIREMENT_ISCHIOS_MUR'],
      },
      {
        type: 'cooldown',
        durationSeconds: 60,
        exerciseIds: ['EXO_CARDIO_MARCHE_PLACE'],
      },
    ],
  },
  {
    key: 'WT_CARDIO_10_MIN_BEGINNER',
    name: 'Cardio doux 10 min',
    kind: 'cardio',
    level: 1,
    targetDurationMinutes: 10,
    blocks: [
      {
        type: 'warmup',
        durationSeconds: 120,
        exerciseIds: ['EXO_MOB_COUP_DEBOUT', 'EXO_MOB_HANCHES'],
      },
      {
        type: 'main',
        durationSeconds: 180,
        exerciseIds: [
          'EXO_CARDIO_MARCHE_PLACE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_CARDIO_MARCHE_FRONTALE',
        ],
      },
      {
        type: 'main',
        durationSeconds: 180,
        exerciseIds: [
          'EXO_CARDIO_MARCHE_PLACE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_CARDIO_JJ_LOW_IMPACT',
        ],
      },
      {
        type: 'cooldown',
        durationSeconds: 120,
        exerciseIds: ['EXO_MOB_COLONNE_CHAT_VACHE'],
      },
    ],
  },
  {
    key: 'WT_FULLBODY_15_MIN_BEGINNER',
    name: 'Full body 15 min (debutant)',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 15,
    blocks: [
      {
        type: 'warmup',
        durationSeconds: 180,
        exerciseIds: ['EXO_MOB_COUP_DEBOUT', 'EXO_MOB_COLONNE_CHAT_VACHE', 'EXO_CARDIO_MARCHE_PLACE'],
      },
      {
        type: 'main',
        durationSeconds: 360,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_PONT_FESSIER',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'main',
        durationSeconds: 360,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_PONT_FESSIER',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'cooldown',
        durationSeconds: 120,
        exerciseIds: ['EXO_MOB_HANCHES', 'EXO_ETIREMENT_ISCHIOS_MUR'],
      },
    ],
  },
  {
    key: 'WT_MIX_20_MIN_BEGINNER',
    name: 'Mix renfo + cardio 20 min',
    kind: 'mixed',
    level: 1,
    targetDurationMinutes: 20,
    blocks: [
      {
        type: 'warmup',
        durationSeconds: 180,
        exerciseIds: ['EXO_MOB_COUP_DEBOUT', 'EXO_MOB_COLONNE_CHAT_VACHE', 'EXO_CARDIO_MARCHE_PLACE'],
      },
      {
        type: 'main',
        durationSeconds: 420,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_PONT_FESSIER',
          'EXO_CARDIO_MARCHE_FRONTALE',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'main',
        durationSeconds: 420,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_PONT_FESSIER',
          'EXO_CARDIO_JJ_LOW_IMPACT',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'cooldown',
        durationSeconds: 180,
        exerciseIds: ['EXO_MOB_HANCHES', 'EXO_ETIREMENT_ISCHIOS_MUR'],
      },
    ],
  },
  {
    key: 'WT_FULLBODY_30_MIN_BASE',
    name: 'Full body 30 min (base)',
    kind: 'mixed',
    level: 2,
    targetDurationMinutes: 30,
    blocks: [
      {
        type: 'warmup',
        durationSeconds: 240,
        exerciseIds: ['EXO_MOB_COUP_DEBOUT', 'EXO_MOB_COLONNE_CHAT_VACHE', 'EXO_CARDIO_MARCHE_PLACE'],
      },
      {
        type: 'main',
        durationSeconds: 480,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_PONT_FESSIER',
          'EXO_CARDIO_MARCHE_FRONTALE',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'main',
        durationSeconds: 480,
        exerciseIds: [
          'EXO_SQUAT_CHAISE',
          'EXO_CARDIO_STEP_TOUCH',
          'EXO_PONT_FESSIER',
          'EXO_CARDIO_JJ_LOW_IMPACT',
          'EXO_POMPE_MUR',
          'EXO_GAINAGE_GENOUX',
        ],
      },
      {
        type: 'cooldown',
        durationSeconds: 300,
        exerciseIds: ['EXO_MOB_HANCHES', 'EXO_ETIREMENT_ISCHIOS_MUR'],
      },
    ],
  },
]

export interface PickWorkoutOptions {
  desiredDurationMinutes: 5 | 10 | 15 | 20 | 30
  preferredKind?: WorkoutKind
  maxLevel?: 1 | 2 | 3
}

export function pickWorkoutTemplate(options: PickWorkoutOptions): WorkoutTemplate | null {
  const { desiredDurationMinutes, preferredKind, maxLevel = 2 } = options

  let candidates = WORKOUT_TEMPLATES.filter((tpl) => {
    if (tpl.targetDurationMinutes !== desiredDurationMinutes) return false
    if (tpl.level > maxLevel) return false
    if (preferredKind && tpl.kind !== preferredKind) return false
    return true
  })

  if (!candidates.length) {
    candidates = WORKOUT_TEMPLATES.filter((tpl) => {
      if (tpl.targetDurationMinutes !== desiredDurationMinutes) return false
      if (tpl.level > maxLevel) return false
      return true
    })
  }

  if (!candidates.length) {
    return null
  }

  if (candidates.length === 1) {
    return candidates[0]!
  }

  const index = Math.floor(Math.random() * candidates.length)
  return candidates[index]!
}
