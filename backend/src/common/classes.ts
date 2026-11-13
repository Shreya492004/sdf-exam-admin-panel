/** Class ids used by the admin panel (LKG to 12th). */
export const CLASS_IDS = ['lkg', 'ukg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const

export const isClassId = (id: string) => (CLASS_IDS as readonly string[]).includes(id)
