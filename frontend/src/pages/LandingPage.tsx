import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  FolderKanban,
  CalendarDays,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import * as THREE from "three";

const FST_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/fr/8/8d/FSTLOGO.svg";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 2.5, 7);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const planeGeometry = new THREE.PlaneGeometry(20, 12, 80, 50);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(220, 82%, 46%)"),
      emissive: new THREE.Color("hsl(45, 95%, 55%)"),
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI / 2.2;
    planeMesh.position.y = -1.6;

    const planePosition = planeGeometry.attributes
      .position as THREE.BufferAttribute;
    const basePositions = Float32Array.from(
      planePosition.array as Float32Array,
    );

    const orbGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(45, 95%, 55%)"),
      emissive: new THREE.Color("hsl(45, 95%, 55%)"),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.3,
    });
    const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
    orbMesh.position.set(0, 0.8, 0);

    scene.add(planeMesh, orbMesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 4, 6);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xffffff, 0.6, 25);
    fillLight.position.set(-6, 2, 4);
    scene.add(fillLight);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let frameId = 0;
    const clock = new THREE.Clock();
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const { width, height, left, top } = canvas.getBoundingClientRect();
      const safeWidth = width || window.innerWidth;
      const safeHeight = height || window.innerHeight;
      const x = (event.clientX - left) / safeWidth;
      const y = (event.clientY - top) / safeHeight;
      targetX = (x - 0.5) * 1.2;
      targetY = (y - 0.5) * 1.0;
    };

    window.addEventListener("pointermove", handlePointerMove);

    const animate = () => {
      const time = clock.getElapsedTime();
      for (let i = 0; i < planePosition.count; i += 1) {
        const i3 = i * 3;
        const x = basePositions[i3];
        const y = basePositions[i3 + 1];
        planePosition.array[i3 + 2] =
          Math.sin((x + time * 1.2) * 0.6) * 0.25 +
          Math.cos((y + time) * 0.6) * 0.2;
      }
      planePosition.needsUpdate = true;

      orbMesh.position.x = Math.sin(time * 0.6) * 1.6;
      orbMesh.position.y = 0.9 + Math.cos(time * 0.8) * 0.4;

      camera.position.x += (targetX * 1.4 - camera.position.x) * 0.06;
      camera.position.y += (2.5 - targetY * 0.8 - camera.position.y) * 0.06;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      planeGeometry.dispose();
      planeMaterial.dispose();
      orbGeometry.dispose();
      orbMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  const features = [
    {
      icon: FolderKanban,
      title: "Suivi de projet",
      desc: "Gérez vos projets de A à Z avec suivi en temps réel",
    },
    {
      icon: CalendarDays,
      title: "Événements",
      desc: "Organisez et participez aux événements du campus",
    },
    {
      icon: Users,
      title: "Membres",
      desc: "Collaborez efficacement avec votre équipe",
    },
    {
      icon: BarChart3,
      title: "Statistiques",
      desc: "Visualisez la progression et les performances",
    },
  ];

  const heroImages = [
    {
      src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
      alt: "Bibliotheque universitaire",
    },
    {
      src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      alt: "Amphitheatre etudiants",
    },
    {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      alt: "Travail collaboratif",
    },
  ];

  const campusHighlights = [
    {
      title: "Vie du campus FST",
      desc: "Découvrez les projets, clubs et initiatives scientifiques qui animent la faculté.",
      src: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80",
      alt: "Vie du campus",
    },
    {
      title: "Evenements et competitions",
      desc: "Suivez les hackathons, conferences et workshops organises par la FST.",
      src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
      alt: "Evenements",
    },
    {
      title: "Clubs et associations",
      desc: "Coordonnez les equipes, les membres et la logistique de vos clubs.",
      src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
      alt: "Clubs",
    },
  ];

  const storyCards = [
    {
      title: "Projets de recherche",
      desc: "Suivi des projets scientifiques avec des jalons clairs et des equipes organisees.",
      src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80",
      alt: "Recherche scientifique",
    },
    {
      title: "Evenements campus",
      desc: "Calendrier centralise pour les journees scientifiques et clubs.",
      src: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1400&q=80",
      alt: "Evenement campus",
    },
    {
      title: "Laboratoires",
      desc: "Coordination des ressources et des equipes entre laboratoires.",
      src: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=1400&q=80",
      alt: "Laboratoire",
    },
  ];

  const eventGallery = [
    {
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      alt: "Conference FST",
    },
    {
      src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      alt: "Atelier etudiants",
    },
    {
      src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      alt: "Equipe projet",
    },
    {
      src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      alt: "Projet collaboratif",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center p-1">
            <img
              src={FST_LOGO_URL}
              alt="FST"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-display font-bold text-lg">FSTEAM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Se connecter
            </Button>
          </Link>
          <Link to="/signup/student">
            <Button size="sm">Créer un compte</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto text-center min-h-[640px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full opacity-90"
          />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm text-primary mb-6">
            <GraduationCap className="h-4 w-4" />
            Faculté des Sciences de Tunis
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
            Gérez vos projets universitaires
            <span className="text-gradient"> & clubs </span>
            facilement
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            FSTEAM centralise la gestion des projets, des evenements et des
            equipes de la FST. Suivez vos taches, coordonnez les clubs et
            valorisez les initiatives scientifiques dans un espace unique.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {heroImages.map((image) => (
              <div
                key={image.src}
                className="relative overflow-hidden rounded-2xl border bg-card shadow-card animate-float"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-48 w-full object-cover transition duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/signup/student">
              <Button
                size="lg"
                className="gap-2 gradient-primary border-0 text-primary-foreground px-8"
              >
                <GraduationCap className="h-5 w-5" />
                Je suis Étudiant / Individu
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup/organization">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                <Users className="h-5 w-5" />
                Je suis Organisation / Club
              </Button>
            </Link>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border shadow-card hover:shadow-elevated transition-shadow animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus highlights */}
      <section className="px-6 py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="lg:w-5/12">
              <h2 className="font-display text-3xl font-bold">
                La FST en mouvement
              </h2>
              <p className="text-muted-foreground mt-3">
                Valorisez les projets, les evenements et les collaborations qui
                font vivre la faculte. FSTEAM devient le point de rassemblement
                pour toutes les initiatives.
              </p>
              <div className="mt-6 space-y-4">
                {campusHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border bg-card p-4 shadow-card"
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {campusHighlights.map((item) => (
                <div
                  key={item.src}
                  className="overflow-hidden rounded-2xl border bg-card shadow-card"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact section */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-bold">
                Une plateforme pour toute la faculte
              </h2>
              <p className="text-muted-foreground">
                FSTEAM simplifie la coordination des clubs, laboratoires et
                initiatives etudiantes. Les equipes partagent un meme espace
                pour planifier, suivre et celebrer leurs projets.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Projets suivis", value: "250+" },
                  { label: "Evenements annuels", value: "60+" },
                  { label: "Membres actifs", value: "1 200+" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border bg-card p-4 text-center shadow-card"
                  >
                    <p className="text-2xl font-display font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {storyCards.map((card) => (
                <div
                  key={card.title}
                  className="overflow-hidden rounded-2xl border bg-card shadow-card animate-float-slow"
                >
                  <img
                    src={card.src}
                    alt={card.alt}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold">{card.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Event gallery */}
      <section className="px-6 py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">
                Moments forts de la FST
              </h2>
              <p className="text-muted-foreground mt-2">
                Confereces, ateliers, competitions et projets qui rythment la
                vie du campus.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Voir le calendrier
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {eventGallery.map((photo, index) => (
              <div
                key={`${photo.src}-${index}`}
                className="overflow-hidden rounded-2xl border bg-card shadow-card"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-sm text-muted-foreground bg-white">
        © 2025 FSTEAM — Faculte des Sciences de Tunis
      </footer>
    </div>
  );
}
