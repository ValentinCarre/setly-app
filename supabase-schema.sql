-- ============================================
-- SCHEMA SETLY — À exécuter dans Supabase SQL Editor
-- ============================================

-- Table des profils (commune artistes + établissements)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('artiste', 'etablissement')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_done BOOLEAN DEFAULT FALSE
);

-- Table artistes
CREATE TABLE artistes (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom_scene TEXT NOT NULL,
  ville TEXT NOT NULL,
  type_artiste TEXT NOT NULL,
  styles TEXT[] DEFAULT '{}',
  bio TEXT,
  photo_url TEXT,
  soundcloud TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  spotify TEXT,
  disponibilites TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table établissements
CREATE TABLE etablissements (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville TEXT NOT NULL,
  site_web TEXT,
  telephone TEXT,
  horaires TEXT,
  type_etablissement TEXT[] DEFAULT '{}',
  ambiances TEXT[] DEFAULT '{}',
  equipements TEXT[] DEFAULT '{}',
  capacite INTEGER,
  photos TEXT[] DEFAULT '{}',
  contact_nom TEXT,
  contact_tel TEXT,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artistes ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements ENABLE ROW LEVEL SECURITY;

-- Policies : lecture publique, écriture par le propriétaire
CREATE POLICY "Profils visibles par tous" ON profiles FOR SELECT USING (true);
CREATE POLICY "Modifier son propre profil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Créer son profil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Artistes visibles par tous" ON artistes FOR SELECT USING (true);
CREATE POLICY "Modifier son profil artiste" ON artistes FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Créer son profil artiste" ON artistes FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Établissements visibles par tous" ON etablissements FOR SELECT USING (true);
CREATE POLICY "Modifier son établissement" ON etablissements FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Créer son établissement" ON etablissements FOR INSERT WITH CHECK (auth.uid() = id);

-- Fonction auto-update du timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket pour les photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Tout le monde peut voir les photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Les utilisateurs connectés peuvent uploader" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent supprimer leurs photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
