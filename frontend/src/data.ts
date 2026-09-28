export type Subject = { id: string; name: string; code: string; color: string; progress: number };
export type Question = { id: string; title: string; subject: string; description: string; date: string; answers: number; status: 'Sin respuesta' | 'En discusión' | 'Resuelta'; author: string; tags: string[]; saved?: boolean };
export type Answer = { id: string; author: string; role: string; text: string; useful: number; solution?: boolean };
export type Task = { id: string; name: string; responsible: string; due: string; status: 'Pendiente' | 'En proceso' | 'Completada' };
export type Resource = { id: string; name: string; subject: string; type: string; description: string; date: string; saved?: boolean };
export type Person = { id: string; name: string; role: 'Docente' | 'Monitor'; subject: string; availability: string; description: string };
export type Group = { id: string; name: string; subject: string; members: number; description: string };

export const subjects: Subject[] = [
  { id: 'calculo', name: 'Cálculo I', code: 'MAT-101', color: '#e5484d', progress: 72 },
  { id: 'programacion', name: 'Programación', code: 'ING-204', color: '#1769aa', progress: 58 },
  { id: 'fisica', name: 'Física I', code: 'FIS-110', color: '#0f766e', progress: 41 },
  { id: 'matematicas', name: 'Matemáticas', code: 'MAT-105', color: '#b7791f', progress: 84 },
];
export const initialQuestions: Question[] = [
  { id: 'q1', title: '¿Cómo puedo entender el cambio de variable?', subject: 'Cálculo I', description: 'Me pierdo al elegir la sustitución correcta en integrales. ¿Alguien podría explicarme un método para identificarla?', date: 'Hoy, 09:42', answers: 4, status: 'En discusión', author: 'Sofía M.', tags: ['integrales', 'parcial'] },
  { id: 'q2', title: 'Error de punteros en el ejercicio 3', subject: 'Programación', description: 'El programa compila pero no devuelve el resultado esperado cuando la lista está vacía.', date: 'Ayer', answers: 2, status: 'Resuelta', author: 'Anónimo', tags: ['C++', 'listas'] },
  { id: 'q3', title: '¿Qué representa la aceleración angular?', subject: 'Física I', description: 'Busco una explicación intuitiva para conectar la fórmula con un ejemplo real.', date: '12 mar', answers: 0, status: 'Sin respuesta', author: 'Daniel R.', tags: ['cinemática'] },
  { id: 'q4', title: 'Preparación para el segundo parcial', subject: 'Matemáticas', description: '¿Qué recursos recomiendan para practicar series y sucesiones?', date: '10 mar', answers: 7, status: 'En discusión', author: 'Laura P.', tags: ['parcial', 'series'] },
];
export const initialAnswers: Record<string, Answer[]> = {
  q1: [{ id: 'a1', author: 'Mateo G.', role: 'Monitor', text: 'Piensa en qué parte de la expresión se deriva de forma sencilla. Esa suele ser una buena candidata para u.', useful: 8 }, { id: 'a2', author: 'Camila R.', role: 'Estudiante', text: 'A mí me ayudó escribir primero la integral como producto y revisar ejemplos resueltos.', useful: 3 }],
  q2: [{ id: 'a3', author: 'Andrés V.', role: 'Monitor', text: 'Recuerda validar el puntero antes de acceder a la posición. Comparte un fragmento si aún falla.', useful: 11, solution: true }],
};
export const resources: Resource[] = [
  { id: 'r1', name: 'Guía de integrales — unidad 2', subject: 'Cálculo I', type: 'Guía', description: 'Ejercicios progresivos para practicar sustitución e integración por partes.', date: 'Actualizado hace 2 días' },
  { id: 'r2', name: 'Mapa de estructuras de datos', subject: 'Programación', type: 'Apunte', description: 'Resumen visual de listas, pilas, colas y árboles.', date: 'Actualizado hace 1 semana' },
  { id: 'r3', name: 'Laboratorio de movimiento circular', subject: 'Física I', type: 'Material de estudio', description: 'Prelaboratorio con conceptos clave y preguntas guía.', date: 'Actualizado hace 2 semanas' },
  { id: 'r4', name: 'Banco de problemas de series', subject: 'Matemáticas', type: 'Documento', description: 'Colección local de problemas para preparar el parcial.', date: 'Actualizado hace 3 semanas' },
];
export const initialTasks: Task[] = [
  { id: 't1', name: 'Resolver ejercicios 4–8', responsible: 'Sofía', due: '18 mar', status: 'En proceso' },
  { id: 't2', name: 'Compartir apuntes del laboratorio', responsible: 'Daniel', due: '20 mar', status: 'Pendiente' },
  { id: 't3', name: 'Preparar presentación', responsible: 'Laura', due: '22 mar', status: 'Completada' },
];
export const notifications = [
  { id: 'n1', text: 'Mateo respondió tu duda de Cálculo.', time: 'Hace 18 min', read: false },
  { id: 'n2', text: 'Tu grupo actualizó una tarea.', time: 'Hace 2 h', read: false },
  { id: 'n3', text: 'Se agregó un recurso en Programación.', time: 'Ayer', read: true },
  { id: 'n4', text: 'Se actualizó un horario común.', time: 'Ayer', read: true },
];
export const people: Person[] = [
  { id: 'p1', name: 'Diana Salazar', role: 'Docente', subject: 'Cálculo I', availability: 'Lun y mié · 2–4 p. m.', description: 'Acompaña procesos de cálculo y preparación de parciales.' },
  { id: 'p2', name: 'Jorge Cárdenas', role: 'Docente', subject: 'Programación', availability: 'Mar y jue · 10–12 m.', description: 'Orientación en fundamentos y estructuras de datos.' },
  { id: 'p3', name: 'Mateo Gómez', role: 'Monitor', subject: 'Cálculo I', availability: 'Disponible ahora · Virtual', description: 'Integrales, límites y preparación para parciales.' },
  { id: 'p4', name: 'Valentina Ruiz', role: 'Monitor', subject: 'Física I', availability: 'Disponible mañana · Presencial', description: 'Cinemática y resolución paso a paso de problemas.' },
];
export const groups: Group[] = [
  { id: 'g1', name: 'Grupo Cálculo — Parcial 2', subject: 'Cálculo I', members: 4, description: 'Estudio semanal para preparar el segundo parcial.' },
  { id: 'g2', name: 'Estructuras de datos', subject: 'Programación', members: 3, description: 'Práctica conjunta de listas, pilas y árboles.' },
  { id: 'g3', name: 'Laboratorio de Física', subject: 'Física I', members: 5, description: 'Coordinación de pre y post laboratorio.' },
];
