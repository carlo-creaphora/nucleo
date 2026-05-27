type LandingScreenProps = {
  onStart: () => void;
};

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <main className="nucleo-landing">
      <div className="nucleo-landing__gradient" />
      <section className="nucleo-landing__content" aria-labelledby="landing-title">
        <h1 id="landing-title" className="nucleo-landing__title">
          Núcleo
        </h1>
        <p className="nucleo-landing__summary">
          Una solución que ayuda a encontrar el reto correcto y convertirlo en
          acción.
        </p>
        <button className="nucleo-landing__button" onClick={onStart} type="button">
          Comenzar
        </button>
        <div className="nucleo-landing__steps" aria-label="Flujo de Núcleo">
          <span>Diagnostica</span>
          <span aria-hidden="true">·</span>
          <span>Idea</span>
          <span aria-hidden="true">·</span>
          <span>Prueba</span>
          <span aria-hidden="true">·</span>
          <span>Evalúa</span>
        </div>
      </section>
    </main>
  );
}
