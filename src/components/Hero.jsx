export default function Hero() {
  return (
    <section className="wrap hero" id="home">
      <div>
        <h1>PAPRDOM <em>— Pick and Place Robot.</em></h1>
        <p>The Pick and Place Robot (PAPR) is an automated robotic system, which identifies, classifies, picks, and sorts objects into their respective designated locations. The system makes use of computer vision to analyze the shape, structure, and position of incoming objects and make decisions regarding their identification, and placement.</p>
        <div className="actions">
          <a className="button" href="#model">Explore 3-D Model</a>
          <a className="button alt" href="#solution">Technical Approach</a>
        </div>
      </div>
      <div className="hero-art">
        <div className="orbit"><i></i></div>
        <div className="orb"></div>
      </div>
    </section>
  )
}
