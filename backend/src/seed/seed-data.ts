import { CLASS_IDS } from '../common/classes'
import type { Question } from '../common/types'

/** Demo data loaded into an empty database on first start (same as the panel's old dummy data). */

type Seed = { name: string; gender: 'Male' | 'Female'; dob: string; parent: string; phone: string }

const pairs: [Seed, Seed][] = [
  [
    { name: 'Aarav Sharma', gender: 'Male', dob: '2022-03-14', parent: 'Rajesh Sharma', phone: '98450 12345' },
    { name: 'Diya Patel', gender: 'Female', dob: '2022-07-02', parent: 'Mehul Patel', phone: '98860 23456' },
  ],
  [
    { name: 'Vihaan Reddy', gender: 'Male', dob: '2021-05-21', parent: 'Suresh Reddy', phone: '99001 34567' },
    { name: 'Ananya Iyer', gender: 'Female', dob: '2021-11-09', parent: 'Kumar Iyer', phone: '97410 45678' },
  ],
  [
    { name: 'Arjun Nair', gender: 'Male', dob: '2020-01-18', parent: 'Pradeep Nair', phone: '98451 56789' },
    { name: 'Saanvi Gupta', gender: 'Female', dob: '2020-08-25', parent: 'Amit Gupta', phone: '98862 67890' },
  ],
  [
    { name: 'Reyansh Joshi', gender: 'Male', dob: '2019-04-11', parent: 'Nitin Joshi', phone: '99002 78901' },
    { name: 'Myra Kulkarni', gender: 'Female', dob: '2019-09-30', parent: 'Sachin Kulkarni', phone: '97411 89012' },
  ],
  [
    { name: 'Krishna Rao', gender: 'Male', dob: '2018-02-07', parent: 'Venkat Rao', phone: '98452 90123' },
    { name: 'Aadhya Menon', gender: 'Female', dob: '2018-06-16', parent: 'Rakesh Menon', phone: '98863 01234' },
  ],
  [
    { name: 'Ishaan Verma', gender: 'Male', dob: '2017-03-22', parent: 'Manoj Verma', phone: '99003 11223' },
    { name: 'Kiara Singh', gender: 'Female', dob: '2017-12-04', parent: 'Harpreet Singh', phone: '97412 22334' },
  ],
  [
    { name: 'Aditya Hegde', gender: 'Male', dob: '2016-05-13', parent: 'Ganesh Hegde', phone: '98453 33445' },
    { name: 'Pari Desai', gender: 'Female', dob: '2016-10-19', parent: 'Kiran Desai', phone: '98864 44556' },
  ],
  [
    { name: 'Sai Kumar', gender: 'Male', dob: '2015-01-27', parent: 'Ravi Kumar', phone: '99004 55667' },
    { name: 'Navya Shetty', gender: 'Female', dob: '2015-07-08', parent: 'Prakash Shetty', phone: '97413 66778' },
  ],
  [
    { name: 'Rohan Mishra', gender: 'Male', dob: '2014-04-03', parent: 'Alok Mishra', phone: '98454 77889' },
    { name: 'Riya Bhat', gender: 'Female', dob: '2014-09-15', parent: 'Shankar Bhat', phone: '98865 88990' },
  ],
  [
    { name: 'Kabir Malhotra', gender: 'Male', dob: '2013-02-20', parent: 'Vikram Malhotra', phone: '99005 99001' },
    { name: 'Sneha Pillai', gender: 'Female', dob: '2013-08-11', parent: 'Mohan Pillai', phone: '97414 10112' },
  ],
  [
    { name: 'Dhruv Agarwal', gender: 'Male', dob: '2012-06-06', parent: 'Sanjay Agarwal', phone: '98455 21223' },
    { name: 'Tanvi Kapoor', gender: 'Female', dob: '2012-11-28', parent: 'Rohit Kapoor', phone: '98866 32334' },
  ],
  [
    { name: 'Yash Chauhan', gender: 'Male', dob: '2011-03-17', parent: 'Deepak Chauhan', phone: '99006 43445' },
    { name: 'Meera Krishnan', gender: 'Female', dob: '2011-10-01', parent: 'Gopal Krishnan', phone: '97415 54556' },
  ],
  [
    { name: 'Nikhil Das', gender: 'Male', dob: '2010-05-09', parent: 'Subrata Das', phone: '98456 65667' },
    { name: 'Pooja Banerjee', gender: 'Female', dob: '2010-12-23', parent: 'Arnab Banerjee', phone: '98867 76778' },
  ],
  [
    { name: 'Rahul Yadav', gender: 'Male', dob: '2009-01-12', parent: 'Mahesh Yadav', phone: '99007 87889' },
    { name: 'Kavya Srinivasan', gender: 'Female', dob: '2009-07-29', parent: 'Srinivasan R', phone: '97416 98990' },
  ],
]

export const seedStudents = CLASS_IDS.map((classId, i) => ({
  classId,
  students: pairs[i].map((s, j) => ({ ...s, rollNo: j + 1, joiningDate: j === 0 ? '2025-06-02' : '2025-06-16' })),
}))

const kg = ['English', 'Maths', 'EVS']
const primary = ['English', 'Maths', 'Science', 'Social Science', 'Hindi']
const middle = ['English', 'Maths', 'Science', 'Social Science', 'Hindi', 'Computer']
const senior = ['English', 'Maths', 'Physics', 'Chemistry', 'Biology']

export const subjectsFor = (classId: string) => {
  if (classId === 'lkg' || classId === 'ukg') return kg
  const n = Number(classId)
  if (n <= 5) return primary
  if (n <= 10) return middle
  return senior
}

type Q = Omit<Question, 'id'>

const mathsQuestions: Q[] = [
  { text: 'What is 7 + 5?', options: ['10', '11', '12', '13'], answer: 2, marks: 1 },
  { text: 'What is 9 × 3?', options: ['27', '21', '24', '30'], answer: 0, marks: 2 },
  { text: 'What is 20 − 8?', options: ['14', '12', '10', '11'], answer: 1, marks: 1 },
  { text: 'Which number is even?', options: ['7', '15', '9', '18'], answer: 3, marks: 1 },
  { text: 'What is half of 50?', options: ['20', '25', '30', '15'], answer: 1, marks: 3 },
]

const englishQuestions: Q[] = [
  { text: 'Which word is a noun?', options: ['Run', 'Happy', 'Table', 'Quickly'], answer: 2, marks: 1 },
  { text: 'Opposite of “hot” is…', options: ['Warm', 'Cold', 'Big', 'Fast'], answer: 1, marks: 1 },
  { text: 'Choose the correct spelling.', options: ['Recieve', 'Receive', 'Receeve', 'Riceive'], answer: 1, marks: 2 },
]

export const seedExams = [
  { suffix: 'exam-1', name: 'Maths MCQ Test 1', subjectId: 'maths', date: '2026-11-20', questions: mathsQuestions },
  { suffix: 'exam-2', name: 'English MCQ Test 1', subjectId: 'english', date: '2026-11-25', questions: englishQuestions },
]
