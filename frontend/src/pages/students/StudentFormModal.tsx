import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, toast } from '../../components/ui'
import { studentsService } from '../../services'
import type { Student } from '../../types'

const schema = z.object({
  fullName: z.string().min(2, 'الاسم قصير جداً').max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email('بريد غير صالح').optional().or(z.literal('')),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().min(2, 'اسم ولي الأمر مطلوب'),
  parentPhone: z.string().min(10, 'رقم هاتف ولي الأمر مطلوب'),
  parentRelation: z.string().default('Parent'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  student: Student | null
  onClose: () => void
  onSaved: () => void
}

export function StudentFormModal({ student, onClose, onSaved }: Props) {
  const isEdit = !!student
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: student ? {
      fullName: student.fullName,
      phone: student.phone ?? '',
      email: student.email ?? '',
    } : { parentRelation: 'Parent' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) => isEdit
      ? studentsService.update(student!.id, data)
      : studentsService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث بيانات الطالب' : 'تم إضافة الطالب بنجاح')
      onSaved()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'حدث خطأ'),
  })

  return (
    <Modal open title={isEdit ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        {/* Student Info */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">بيانات الطالب</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">الاسم الكامل *</label>
              <input {...register('fullName')} className="input w-full" placeholder="الاسم الكامل للطالب" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input {...register('phone')} className="input w-full" placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input type="email" {...register('email')} className="input w-full" dir="ltr" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">الرقم القومي</label>
              <input {...register('nationalId')} className="input w-full" />
            </div>
            <div>
              <label className="label">تاريخ الميلاد</label>
              <input type="date" {...register('dateOfBirth')} className="input w-full" />
            </div>
            <div className="col-span-2">
              <label className="label">العنوان</label>
              <input {...register('address')} className="input w-full" />
            </div>
          </div>
        </div>

        {/* Parent Info - only for new students */}
        {!isEdit && (
          <div>
            <hr className="border-gray-200 dark:border-gray-700 mb-4" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">بيانات ولي الأمر</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">اسم ولي الأمر *</label>
                <input {...register('parentName')} className="input w-full" />
                {errors.parentName && <p className="text-xs text-red-500 mt-1">{errors.parentName.message}</p>}
              </div>
              <div>
                <label className="label">هاتف ولي الأمر *</label>
                <input {...register('parentPhone')} className="input w-full" placeholder="01xxxxxxxxx" />
                {errors.parentPhone && <p className="text-xs text-red-500 mt-1">{errors.parentPhone.message}</p>}
              </div>
              <div>
                <label className="label">صلة القرابة</label>
                <select {...register('parentRelation')} className="input w-full">
                  <option value="Parent">والد / والدة</option>
                  <option value="Guardian">ولي أمر</option>
                  <option value="Sibling">أخ / أخت</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">إلغاء</button>
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary min-w-[80px]">
            {mutation.isPending
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              : isEdit ? 'تحديث' : 'إضافة'
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}
