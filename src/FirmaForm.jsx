import { useState } from 'react';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf'; // Importujemo biblioteku za PDF
import './styles.css';

export default function FirmaForm() {
  const [formData, setFormData] = useState({
    naziv_firme: '',
    kontakt_osoba: '',
    email: '',
    opis_pozicije: '',
    broj_mjesta: '',
    ima_praksu: false
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generatePDF = async (prijavaId) => {
    const doc = new jsPDF();
    doc.text(`Naziv firme: ${formData.naziv_firme}`, 10, 10);
    doc.text(`Kontakt osoba: ${formData.kontakt_osoba}`, 10, 20);
    doc.text(`Email: ${formData.email}`, 10, 30);
    doc.text(`Opis pozicije: ${formData.opis_pozicije}`, 10, 40);
    doc.text(`Broj mjesta: ${formData.broj_mjesta}`, 10, 50);

    const pdfBlob = doc.output('blob');

    // Generisanje jedinstvenog imena za PDF
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_'); // Formatiramo timestamp
    const fileName = `prijava_${formData.naziv_firme}_${formData.opis_pozicije}_${timestamp}.pdf`;

    // Upload PDF na Supabase Storage
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('Greška pri uploadu PDF-a:', error.message);
      setStatus('Greška pri spremanju PDF-a.');
      return;
    }

    console.log('PDF uploadovan:', data);

    // Ručno generisanje javnog URL-a za PDF
    const publicURL = `https://emnhomcsaeoejmviyyps.supabase.co/storage/v1/object/public/pdfs/${fileName}`;
    console.log('Public URL (ručno generisan):', publicURL);

    if (publicURL) {
      // Ažuriranje prijave u bazi sa URL-om PDF-a
      const { error: updateError } = await supabase
        .from('prijave_firmi')
        .update({ pdf_url: publicURL })
        .eq('id', prijavaId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Dodavanje prijave firme u bazu
    const { data, error } = await supabase.from('prijave_firmi').insert([formData]).select();
    if (error) {
      console.error(error);
      setStatus('Greška pri spremanju.');
    } else {
      setStatus('Uspješno spremljeno!');
      const prijavaId = data[0].id; // Dobijamo ID nove prijave
      await generatePDF(prijavaId); // Generišemo i uploadujemo PDF, povezujući ga sa prijavom
      setFormData({
        naziv_firme: '',
        kontakt_osoba: '',
        email: '',
        opis_pozicije: '',
        broj_mjesta: '',
        ima_praksu: false
      });
    }
  };

  return (
    <div className="form-wrapper">
      <h1 className="form-title">Prijava firme za praksu</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="naziv_firme">Naziv firme</label>
          <input
            type="text"
            name="naziv_firme"
            id="naziv_firme"
            value={formData.naziv_firme}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kontakt_osoba">Kontakt osoba</label>
          <input
            type="text"
            name="kontakt_osoba"
            id="kontakt_osoba"
            value={formData.kontakt_osoba}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="opis_pozicije">Opis pozicije</label>
          <textarea
            name="opis_pozicije"
            id="opis_pozicije"
            value={formData.opis_pozicije}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="broj_mjesta">Broj mjesta</label>
          <input
            type="number"
            name="broj_mjesta"
            id="broj_mjesta"
            value={formData.broj_mjesta}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="form-button">Pošalji prijavu</button>
        {status && <p className="form-status">{status}</p>}
      </form>
    </div>
  );
}
