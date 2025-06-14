import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import FirmaForm from "./FirmaForm";
import './styles.css'; 

export default function AdminDashboard() {
  const [prijave, setPrijave] = useState([]);
  const [prakse, setPrakse] = useState([]);
  const [naziv, setNaziv] = useState("");
  const [opis, setOpis] = useState("");
  const [brojMjesta, setBrojMjesta] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFirmaForm, setShowFirmaForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showPrakse, setShowPrakse] = useState(false);

  // Fetch prijave firmi
  const fetchPrijave = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("prijave_firmi").select("*").order("timestamp", { ascending: false });
    if (error) {
      console.error("Greška pri učitavanju prijava:", error.message);
    } else {
      setPrijave(data);
    }
    setLoading(false);
  };

  // Fetch prakse
  const fetchPrakse = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prakse")
      .select(`
        id,
        naziv_pozicije,
        broj_mjesta,
        aktivna,
        aplikacije (
          student_id,
          users (email, ime, prezime)
        )
      `)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Greška pri učitavanju praksi:", error.message);
    } else {
      setPrakse(data);
    }
    setLoading(false);
  };

  // Kreiranje prakse
  const createPraksa = async () => {
    if (!naziv || !opis || brojMjesta <= 0) {
      alert("Molimo popunite sva polja!");
      return;
    }

    const { error } = await supabase.from("prakse").insert({
      naziv_pozicije: naziv,
      opis,
      broj_mjesta: brojMjesta,
      aktivna: true,
    });

    if (error) {
      console.error("Greška pri kreiranju prakse:", error.message);
      alert("Došlo je do greške pri kreiranju prakse.");
    } else {
      alert("Praksa uspešno kreirana!");
      setNaziv("");
      setOpis("");
      setBrojMjesta(1);
      fetchPrakse();
    }
  };

  // Automatsko popunjavanje prakse iz obrazca
  const handleFirmaSubmit = async (formData) => {
    setNaziv(formData.opis_pozicije);
    setOpis(formData.opis_pozicije);
    setBrojMjesta(formData.broj_mjesta);

    // Automatski dodaj praksu
    await createPraksa(); // Dodato `await` da sačekamo kreiranje prakse
    setShowFirmaForm(false);
    setShowDashboard(true);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Greška pri odjavi:", error.message);
      } else {
        window.location.href = "/"; // Preusmerava korisnika na početnu stranicu
      }
    } catch (error) {
      console.error("Greška pri odjavi:", error.message);
    }
  };

  useEffect(() => {
    fetchPrijave();
    fetchPrakse();
  }, []);

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>STUDENTSKA<br />PRAKSA</h2>
        <nav>
          <ul>
            <li><a href="#" onClick={() => { setShowDashboard(true); setShowFirmaForm(false); setShowPrakse(false); }}>Upravljačka ploča</a></li>
            <li><a href="#" onClick={() => { setShowDashboard(false); setShowFirmaForm(false); setShowPrakse(true); }}>Prakse</a></li>
            <li><a href="#" onClick={() => { setShowDashboard(false); setShowFirmaForm(true); setShowPrakse(false); }}>Obrazac</a></li>
           
            <li><a href="#" onClick={handleLogout}>Odjavi me</a></li> {/* Dodato dugme za odjavu */}
          </ul>
        </nav>
      </aside>

      <main className="main">
        {showFirmaForm ? (
          <FirmaForm onSubmit={handleFirmaSubmit} /> // Prosleđujemo funkciju za automatsko popunjavanje
        ) : showPrakse ? (
          <section className="section prakse">
            <h2>Prakse</h2>
            {loading ? (
              <div className="loading">Učitavanje...</div>
            ) : prakse.length > 0 ? (
              <div className="prakse-grid">
                {prakse.map((p) => (
                  <div key={p.id} className="praksa-card">
                    <h3 className="praksa-title">{p.naziv_pozicije}</h3>
                    <p className="praksa-info">
                      <strong>Broj mjesta:</strong> {p.broj_mjesta}
                    </p>
                    <p className="praksa-info">
                      <strong>Status:</strong> {p.aktivna ? "Aktivna" : "Neaktivna"}
                    </p>
                    <p className="praksa-info">
                      <strong>Prijavljeni korisnici:</strong>
                      {p.aplikacije.length > 0 ? (
                        <ul>
                          {p.aplikacije.map((a) => (
                            <li key={a.student_id}>
                              {a.users?.ime} {a.users?.prezime} ({a.users?.email})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Nema prijava"
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-prakse">Trenutno nema dostupnih praksi.</p>
            )}
          </section>
        ) : showDashboard ? (
          <>
            <h1>Upravljačka ploča</h1>

            <section className="section">
              <h2>Prijave firmi</h2>
              {loading ? (
                <div>Učitavanje...</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Naziv firme</th>
                      <th>Kontakt osoba</th>
                      <th>Email</th>
                      <th>Broj mjesta</th>
                      <th>Timestamp</th>
                      <th>PDF</th> {/* Dodato za prikaz PDF-a */}
                    </tr>
                  </thead>
                  <tbody>
                    {prijave.map((p) => (
                      <tr key={p.id}>
                        <td>{p.naziv_firme}</td>
                        <td>{p.kontakt_osoba}</td>
                        <td>{p.email}</td>
                        <td>{p.broj_mjesta}</td>
                        <td>{new Date(p.timestamp).toLocaleString()}</td>
                        <td>
                          {p.pdf_url ? (
                            <a href={p.pdf_url} target="_blank" rel="noopener noreferrer">Preuzmi PDF</a>
                          ) : (
                            "Nema PDF-a"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="section create-praksa">
              <h2>Kreiraj praksu</h2>
              <form className="form-grid">
                <div className="form-group">
                  <label htmlFor="naziv">Naziv firme</label>
                  <input
                    id="naziv"
                    className="form-input"
                    placeholder="Naziv firme"
                    value={naziv}
                    onChange={(e) => setNaziv(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="opis">Opis</label>
                  <textarea
                    id="opis"
                    className="form-textarea"
                    placeholder="Opis"
                    value={opis}
                    onChange={(e) => setOpis(e.target.value)}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="brojMjesta">Broj mjesta</label>
                  <input
                    id="brojMjesta"
                    className="form-input"
                    type="number"
                    placeholder="Broj mjesta"
                    value={brojMjesta}
                    onChange={(e) => setBrojMjesta(e.target.value)}
                  />
                </div>
                <button type="button" className="form-button" onClick={createPraksa}>
                  Spremi praksu
                </button>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
