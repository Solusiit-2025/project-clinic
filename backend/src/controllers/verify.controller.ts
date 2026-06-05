import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const verifyLabOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Hanya cari data lab yang statusnya completed
        const labOrder = await prisma.labOrder.findUnique({
            where: { id },
            include: {
                patient: true,
                doctor: true,
                results: {
                    include: {
                        testMaster: true
                    }
                }
            }
        })

        if (!labOrder || labOrder.status !== 'completed') {
            return res.status(404).json({ message: 'Dokumen tidak ditemukan atau belum selesai.' })
        }

        // Data Masking Protocol
        const maskName = (name: string) => {
            return name.split(' ').map(word => {
                if (word.length <= 2) return word;
                return word.substring(0, 2) + '*'.repeat(word.length - 2);
            }).join(' ');
        };

        const calculateAge = (dob: Date | null) => {
            if (!dob) return null;
            const diff = Date.now() - new Date(dob).getTime();
            const age = new Date(diff);
            return Math.abs(age.getUTCFullYear() - 1970);
        };

        const age = calculateAge(labOrder.patient.dateOfBirth);

        const maskedData = {
            id: labOrder.id,
            orderNo: labOrder.orderNo,
            orderDate: labOrder.orderDate,
            completedAt: labOrder.completedAt,
            patient: {
                name: maskName(labOrder.patient.name),
                gender: labOrder.patient.gender === 'M' ? 'Laki-laki' : 'Perempuan',
                age: age ? `${age} Tahun` : '- Tahun',
                medicalRecordNoMasked: labOrder.patient.medicalRecordNo.substring(0, 4) + '***'
            },
            doctor: {
                name: labOrder.doctor?.name || 'Pasien Mandiri'
            },
            results: labOrder.results.map(r => ({
                testName: r.testMaster.name,
                category: r.testMaster.category,
                resultValue: r.resultValue,
                unit: r.testMaster.unit,
                normalRangeText: r.testMaster.normalRangeText,
                isCritical: r.isCritical
            }))
        };

        return res.json(maskedData);
    } catch (error) {
        console.error('Verify Lab Error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan pada server saat verifikasi.' });
    }
}
