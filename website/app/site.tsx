'use client';
import { ArrowUpRight } from 'lucide-react';
import Journey from './journey';
import QuoteForm from './quote-form';
import CruiseVideo from './cruise-video';
import RotationViewer from './rotation-viewer';
import { assetUrl } from '@/lib/assets';
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#details">
        Skip the tour
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href="#top"
          aria-label="Mario’s Signature Limousine home"
        >
          <span>MARIO’S</span>
          <small>SIGNATURE LIMOUSINE</small>
        </a>
        <nav aria-label="Main navigation">
          <a href="#experience">The experience</a>
          <a href="#occasions">Your occasion</a>
          <a className="nav-quote" href="#quote">
            Request a quote <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      <main id="top">
        <Journey />
        <section className="vehicle-section content-pad vehicle-rotation" id="details">
          <RotationViewer />
          <div className="section-top">
            <p className="eyebrow">01 / THE LIMOUSINE</p>
            <p>ONE DISTINCTIVE RIDE</p>
          </div>
          <div className="split-heading">
            <h2>
              Some arrivals
              <br />
              <em>stay with you.</em>
            </h2>
            <p>
              A custom white SUV limousine with a commanding grille, an extended
              silhouette, and a cabin made for sharing the occasion.
            </p>
          </div>
          <div className="photo-note">
            <span>THE ACTUAL LIMOUSINE</span>
            <span>Custom exterior. Personal atmosphere.</span>
          </div>
        </section>
        <CruiseVideo />
        <section className="interior-section content-pad">
          <div className="interior-photo">
            <img
              src={assetUrl('photos/cabin.jpg')}
              alt="Actual cabin with two-tone seating, mirrored star ceiling, colored lighting and drinks cabinet"
              loading="lazy"
            />
          </div>
          <div className="interior-copy">
            <p className="eyebrow">02 / STEP INSIDE</p>
            <h2>
              Your evening.
              <br />
              <em>Your atmosphere.</em>
            </h2>
            <p>
              Two-tone seating. A mirrored, star-lit ceiling. Color that changes
              the mood. Take a closer look at the space behind the door.
            </p>
            <a className="text-link" href="#quote">
              Plan your occasion <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
        <section className="occasions content-pad" id="occasions">
          <p className="eyebrow">03 / YOUR OCCASION</p>
          <h2>
            Where will the
            <br />
            <em>evening take you?</em>
          </h2>
          <div className="occasion-list">
            {[
              'A wedding celebration',
              'A night in Houston',
              'A milestone worth marking',
              'Your own kind of occasion',
            ].map((item, i) => (
              <a href="#quote" key={item}>
                <span className="occasion-number">0{i + 1}</span>
                <h3>{item}</h3>
                <ArrowUpRight />
              </a>
            ))}
          </div>
          <p className="muted">
            Share your plans so timing, trip details, and suitability can be
            confirmed.
          </p>
        </section>
        <section className="quote-section content-pad" id="quote">
          <div className="quote-heading">
            <p className="eyebrow">LET’S PLAN SOMETHING MEMORABLE</p>
            <h2>
              It starts with
              <br />
              <em>your plans.</em>
            </h2>
            <p>
              Tell us about the occasion. Pricing, timing, and vehicle
              suitability will need to be confirmed for your trip.
            </p>
            <img
              src={assetUrl('photos/entry.jpg')}
              alt="The actual passenger doorway with illuminated cabin beyond"
              loading="lazy"
            />
          </div>
          <QuoteForm />
        </section>
      </main>
      <footer className="content-pad">
        <a className="wordmark" href="#top">
          <span>MARIO’S</span>
          <small>SIGNATURE LIMOUSINE</small>
        </a>
        <p>Houston, Texas</p>
        <a href="#top">Back to the beginning ↑</a>
      </footer>
    </>
  );
}
