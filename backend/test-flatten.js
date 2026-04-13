const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const flattenDepartments = (depts, parentId = null) => {
  let result = []
  const currentLevel = depts.filter(d => d.parentId === parentId)
  
  currentLevel.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name))

  for (const dept of currentLevel) {
    result.push(dept)
    const children = flattenDepartments(depts, dept.id)
    result = [...result, ...children]
  }
  return result
}

async function check() {
  try {
      const targetClinicId = 'dddbdf2f-1afa-45a2-b0f3-07a0dff4ac9c';
      let departments = await prisma.department.findMany({
          where: {
            OR: [
              { clinicId: targetClinicId },
              { clinicId: null }
            ] 
          },
      });
      console.log('Raw Departments:', departments.length);
      const flat = flattenDepartments(departments);
      console.log('Flattened:', flat.length);
  } finally {
      process.exit(0);
  }
}

check();
