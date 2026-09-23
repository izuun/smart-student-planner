import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { fullname: user.fullname } };
}

export default function Sdg({ fullname }) {
  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>
            <i className="fa-solid fa-globe"></i> Sustainable Development
            Goal 4
          </h1>
          <br />

          <div className="sdg-banner">
            <h2>Quality Education</h2>
            <p>
              Smart Student Planner helps students stay organised and on
              top of their academic responsibilities, supporting more
              effective, self-directed learning.
            </p>
          </div>

          <div className="sdg-grid">
            <div className="card">
              <i className="fa-solid fa-book"></i>
              <h3>Better Study Habits</h3>
              <p>
                Structured task tracking encourages consistent study
                routines instead of last-minute cramming.
              </p>
            </div>
            <div className="card">
              <i className="fa-solid fa-clock"></i>
              <h3>Time Management</h3>
              <p>
                Deadlines and priorities are visible at a glance, helping
                students plan their time realistically.
              </p>
            </div>
            <div className="card">
              <i className="fa-solid fa-chart-line"></i>
              <h3>Progress Awareness</h3>
              <p>
                Built-in statistics let students reflect on their
                productivity and adjust their approach over time.
              </p>
            </div>
            <div className="card">
              <i className="fa-solid fa-users"></i>
              <h3>Accessible Learning Tools</h3>
              <p>
                A free, lightweight planner reduces barriers to good
                academic organisation for every student.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
