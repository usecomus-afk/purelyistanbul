import { rateLimit } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { AestheticServiceEngine } from '@/services/aestheticService';

export async function POST(req: Request) {
  const limited = rateLimit(req, 'aes-book', 20, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { 
      clinic_id, 
      service_id, 
      guest_name, 
      guest_phone, 
      guest_email, 
      hotel_id, 
      room_number, 
      appointment_date, 
      start_time, 
      end_time,
      notes 
    } = body;

    if (!clinic_id || !service_id || !guest_name || !guest_phone || !appointment_date || !start_time) {
      return NextResponse.json(
        { success: false, error: 'Eksik randevu bilgileri. Lütfen tüm zorunlu alanları doldurunuz.' },
        { status: 400 }
      );
    }

    const booking = await AestheticServiceEngine.bookAppointment({
      clinic_id,
      service_id,
      guest_name,
      guest_phone,
      guest_email: guest_email || '',
      hotel_id,
      room_number,
      appointment_date,
      start_time,
      end_time: end_time || `${parseInt(start_time.split(':')[0], 10) + 1}:00`,
      notes
    });

    return NextResponse.json({
      success: true,
      booking,
      message: 'Randevunuz kliniğin canlı takvimine işlendi ve başarıyla onaylandı.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function GET() {
  const appointments = AestheticServiceEngine.getAppointments();
  return NextResponse.json({ success: true, count: appointments.length, appointments });
}
