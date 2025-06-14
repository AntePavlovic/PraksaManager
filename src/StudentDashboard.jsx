import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import './styles.css'; 

export default function StudentDashboard({ user }) {
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cv, setCv] = useState(null);
  const [motivacija, setMotivacija] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user || !user.id) {
      console.error("User nije definisan ili nema ID.");
      return;
    }

    const fetchApplicationsAndInternships = async () => {
      try {
        // Učitaj prijave
        const { data: applicationsData, error: applicationsError } = await supabase
          .from("aplikacije")
          .select(`
            praksa_id,
            status,
            prakse (
              naziv_pozicije,
              broj_mjesta,
              prijave_firmi (pdf_url)
            )
          `)
          .eq("student_id", user.id);

        if (applicationsError) {
          console.error("Greška pri učitavanju prijava:", applicationsError.message);
          return;
        }

        setApplications(applicationsData || []);

        // Učitaj prakse, filtrirajući prijavljene
        const appliedPraksaIds = applicationsData.map((app) => app.praksa_id);
        const formattedIds = appliedPraksaIds.length > 0 ? `(${appliedPraksaIds.join(",")})` : "()";

        console.log("Prijavljene prakse IDs:", appliedPraksaIds);
        console.log("Formatted IDs for filter:", formattedIds);

        const { data: internshipsData, error: internshipsError } = await supabase
          .from("prakse")
          .select("*")
          .not("id", "in", formattedIds)
          .order("timestamp", { ascending: false });

        if (internshipsError) {
          console.error("Greška pri učitavanju praksi:", internshipsError.message);
          return;
        }

        setInternships(internshipsData || []);
      } catch (error) {
        console.error("Greška pri učitavanju podataka:", error.message);
      }
    };

    fetchApplicationsAndInternships();
  }, [user]);

  const uploadDocs = async () => {
    try {
      if (cv) {
        await supabase.storage.from("studenti").upload(`${user.id}/cv.pdf`, cv, {
          upsert: true,
        });
      }
      if (motivacija) {
        await supabase.storage.from("studenti").upload(`${user.id}/motivacija.pdf`, motivacija, {
          upsert: true,
        });
      }
      setStatus("Dokumenti uspešno uploadovani!");
    } catch (error) {
      console.error("Greška pri uploadu dokumenata:", error.message);
      setStatus("Greška pri uploadu dokumenata.");
    }
  };

  const apply = async (praksaId) => {
    try {
      await supabase.from("aplikacije").insert({
        praksa_id: praksaId,
        student_id: user.id,
        status: "pending",
        cv_url: cv ? `${user.id}/cv.pdf` : null,
        motivacijsko_url: motivacija ? `${user.id}/motivacija.pdf` : null,
      });
      setStatus("Uspešno ste se prijavili na praksu!");
      setInternships((prev) => prev.filter((internship) => internship.id !== praksaId));
      const { data } = await supabase
        .from("aplikacije")
        .select("praksa_id")
        .eq("student_id", user.id);
      setApplications(data || []);
    } catch (error) {
      console.error("Greška pri prijavi na praksu:", error.message);
      setStatus("Greška pri prijavi na praksu.");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Greška pri odjavi:", error.message);
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Greška pri odjavi:", error.message);
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>STUDENTSKA<br />PRAKSA</h2>
        <nav>
          <ul>
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Ponuda praksi</a></li>
            <li><a href="#">Prijave</a></li>
            <li><a href="#" onClick={handleLogout}>Odjavi me</a></li>
          </ul>
        </nav>
      </aside>

      <main className="main">
        <h1>Student Dashboard</h1>

        <section className="section">
          <h2>Ponuda praksi</h2>
          {internships.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Spots</th>
                  <th>PDF</th> {/* Dodato */}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {internships.map((internship) => (
                  <tr key={internship.id}>
                    <td>{internship.naziv_pozicije}</td>
                    <td>{internship.broj_mjesta}</td>
                    <td>
                      {internship.prijave_firmi?.pdf_url ? (
                        <a href={internship.prijave_firmi.pdf_url} target="_blank" rel="noopener noreferrer">
                          Preuzmi PDF
                        </a>
                      ) : (
                        "Nema PDF-a"
                      )}
                    </td>
                    <td>
                      <button className="btn" onClick={() => apply(internship.id)}>Apply</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nema dostupnih praksi.</p>
          )}
        </section>

        <section className="section">
          <h2>Prijave</h2>
          {applications.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Spots</th>
                  <th>Status</th>
                  <th>PDF</th> {/* Dodato */}
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.praksa_id}>
                    <td>{application.prakse?.naziv_pozicije || "N/A"}</td>
                    <td>{application.prakse?.broj_mjesta || "N/A"}</td>
                    <td>
                      {application.status === "pending" ? (
                        <div className="status-pending">Čekanje</div>
                      ) : (
                        application.status
                      )}
                    </td>
                    <td>
                      {application.prakse?.prijave_firmi?.pdf_url ? (
                        <a href={application.prakse.prijave_firmi.pdf_url} target="_blank" rel="noopener noreferrer">
                          Preuzmi PDF
                        </a>
                      ) : (
                        "Nema PDF-a"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nema prijava.</p>
          )}
        </section>

        <section className="section">
          <h2>Upload Documents</h2>
          <input type="file" onChange={(e) => setCv(e.target.files[0])} />
          <input type="file" onChange={(e) => setMotivacija(e.target.files[0])} />
          <button className="btn" onClick={uploadDocs}>Upload dokumenata</button>
        </section>

        {status && <p className="form-status">{status}</p>}
      </main>
    </div>
  );
}
