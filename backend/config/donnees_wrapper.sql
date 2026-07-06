SET FOREIGN_KEY_CHECKS=0; 
/*M!999999\- enable the sandbox mode */ 
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `categories` VALUES
(1,'Électroménagers','Appareils électroménagers pour la maison',NULL),
(2,'Électroniques','Produits électroniques et high-tech',NULL),
(3,'Modes & Accessoires','Vêtements, chaussures et accessoires de mode',NULL),
(4,'Cosmétiques & Beauté','Produits de beauté, soins et cosmétiques',NULL),
(5,'Sport & Loisirs','Équipements sportifs et articles de loisirs',NULL),
(6,'Meubles','Mobilier et décoration intérieure',NULL),
(7,'Jouets & Enfants','Jouets, jeux et articles pour enfants',NULL),
(8,'Fournitures & Papeterie','Fournitures de bureau, papeterie et scolaire',NULL);
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `commerces` VALUES
(3,7,'Kaba Électroniques','Électroniques',NULL,NULL,'/uploads/commerces/logo-1782993616745-64663847.jpg',1,'2026-06-30 14:43:02'),
(4,8,'Daf Électroménagers',NULL,NULL,NULL,NULL,1,'2026-06-30 14:43:02'),
(5,9,'Liou Meubles',NULL,NULL,NULL,NULL,1,'2026-06-30 14:43:02'),
(6,13,'Sankaran Shop','Modes & Accessoires — Sankaran Shop est votre boutique en ligne dédiée à la mode. Nous vous proposons une sélection de chaussures, vêtements et accessoires tendance, alliant qualité, style et prix accessibles. Notre mission est de vous offrir des produits élégants pour sublimer votre look au quotidien.',NULL,NULL,'/uploads/commerces/logo-1783089896429-547682249.png',1,'2026-07-03 14:44:56');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `livreur_disponibilites` VALUES
(3,15,1,'2026-07-03 10:14:58'),
(4,16,1,'2026-06-30 14:43:03');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `produits` VALUES
(2,3,2,'Ordinateur Portable OEM','Ordinateur portable OEM économique de 14 pouces au design épuré, idéal pour un usage personnel et domestique au quotidien.',1750000.00,10,'[\"/uploads/produits/produit-1782900710860-837913161.png\"]',NULL,1,'2026-06-30 15:42:15'),
(3,3,2,'Smartphone S25 Ultra 5G Double SIM (16 Go + 1 To)','Smartphone 5G double SIM au design premium inspiré des tendances actuelles, doté d\'une grande capacité de stockage et accompagné de son stylet.',1850000.00,20,'[\"/uploads/produits/produit-1782904433738-635373428.png\"]',NULL,1,'2026-07-01 11:13:53'),
(4,3,2,'Smartphone Générique Style S26 Ultra (22 Go + 2 To)','Smartphone 5G performant doté d\'un très grand écran de 7,3 pouces, d\'une batterie haute capacité de 7800 mAh et fourni avec son stylet.',1650000.00,14,'[\"/uploads/produits/produit-1782904713015-630563239.png\"]',NULL,1,'2026-07-01 11:18:33'),
(5,3,2,'iPhone 17 Pro Max','iPhone haut de gamme d\'occasion certifié de haute qualité, offrant des performances exceptionnelles et un système photographique de niveau professionnel.',16500000.00,58,'[\"/uploads/produits/produit-1782904899415-980764028.png\"]',NULL,1,'2026-07-01 11:21:39'),
(6,3,2,'iPhone Série 11 Pro','iPhone 11 Pro de haute qualité et entièrement débloqué tout opérateur, alliant une fluidité remarquable et un excellent système de caméras.',3400000.00,0,'[\"/uploads/produits/produit-1782905592162-144985616.png\"]',NULL,1,'2026-07-01 11:32:44'),
(7,3,2,'iPhone 15 Pro Max 512 Go / 8 Go','iPhone 15 Pro Max authentique et débloqué, offrant un stockage massif de 512 Go et 8 Go de RAM pour des performances de luxe et une expérience photo professionnelle.',10250000.00,5,'[\"/uploads/produits/produit-1782905801888-112681837.png\"]',NULL,1,'2026-07-01 11:36:41'),
(8,3,2,'iPhone 12 Pro','iPhone 12 Pro au design élégant et épuré, doté d\'un écran de 6,1 pouces pour une prise en main confortable et une utilisation quotidienne fluide.',2650000.00,1,'[\"/uploads/produits/produit-1782906242814-265476165.png\"]',NULL,1,'2026-07-01 11:44:02'),
(9,3,2,'iPhone 14 Pro Max','iPhone 14 Pro Max authentique alliant de superbes performances à un système de triple caméra professionnel (disponible de 128 Go à 512 Go).',6300000.00,15,'[\"/uploads/produits/produit-1782906450130-441246532.png\"]',NULL,1,'2026-07-01 11:47:30'),
(10,3,2,'Ordinateur Tout-en-Un (All-in-One) à Écran Courbé LED LCD.','Ordinateur de bureau Tout-en-Un performant doté d\'un design élégant à écran courbé LED LCD, idéal pour optimiser l\'espace et offrir un confort visuel exceptionnel au quotidien.',4850000.00,9,'[\"/uploads/produits/produit-1782906576681-43146994.png\"]',NULL,1,'2026-07-01 11:49:36'),
(11,3,2,'Ordinateur de Bureau Tout-en-Un 23,8 Pouces (Configurations I3, I5, I7 disponibles).','Ordinateur de bureau Tout-en-Un de 23,8 pouces au design blanc épuré et à écran ultra-fin, parfait pour exécuter vos tâches quotidiennes tout en optimisant votre espace de travail.',4250000.00,89,'[\"/uploads/produits/produit-1782906900754-809027994.png\"]',NULL,1,'2026-07-01 11:55:00'),
(12,3,2,'Ordinateur Portable HP EliteBook 660 G11 (16 Pouces)','Ordinateur portable HP professionnel performant doté d’un écran 16 pouces WUXGA et d’un puissant processeur Intel Core Ultra au design argenté élégant.',8950000.00,2,'[\"/uploads/produits/produit-1782907148727-770596505.png\"]',NULL,1,'2026-07-01 11:59:08'),
(13,3,2,'Console de Jeu Électronique P-S5 avec Pack d\'Accessoires Complet','Console de jeu PS5 de haute performance au design moderne, livrée avec un pack complet d\'accessoires incluant deux manettes, un casque gaming et sa station de recharge dédiée.',1950000.00,57,'[\"/uploads/produits/produit-1782907377100-130008718.png\"]',NULL,1,'2026-07-01 12:02:57'),
(14,3,2,'Console PlayStation 5 (Édition Personnalisée Spider-Man) 1 To de Stockage interne','Console de salon PlayStation 5 d\'occasion dotée d\'un lecteur de disque Blu-ray et d\'un espace de stockage de 1 To. Elle se démarque par ses façades personnalisées au style dynamique noir et rouge inspiré de Spider-Man, et elle est accompagnée d\'une manette sans fil DualSense assortie.',3850000.00,34,'[\"/uploads/produits/produit-1782907613219-35838476.png\"]',NULL,1,'2026-07-01 12:06:53'),
(15,3,2,'Console PlayStation 5 Slim – 1 To','Modèle plus compact et léger, cette PlayStation 5 Slim en version entièrement numérique (sans lecteur de disque) dispose d\'un espace de stockage SSD de 1 To pour des chargements ultra-rapides. Elle est livrée neuve dans sa boîte avec une manette sans fil DualSense blanche.',3950000.00,25,'[\"/uploads/produits/produit-1782907905457-941103917.png\"]',NULL,1,'2026-07-01 12:11:45'),
(16,3,2,'Écouteurs Sans Fil Bluetooth (Design Clip-on / Sport avec Réduction de Bruit)','Écouteurs sans fil innovants à conduction aérienne adoptant un style \"clip\" confortable qui se fixe sur l\'oreille sans obstruer le canal auditif. Idéals pour le sport, ils disposent de la réduction de bruit ambiant (ENC) pour des appels clairs et d\'un son stéréo amélioré.',180000.00,158,'[\"/uploads/produits/produit-1782908492011-486920776.png\"]',NULL,1,'2026-07-01 12:21:32'),
(17,3,2,'Écouteurs sans fil SoundPEATS Air3 PRO','Écouteurs intra-auriculaires performants dotés d\'un chipset de dernière génération, de la connectivité Bluetooth 5.2 et d\'une technologie de réduction active du bruit (ANC) pour une immersion sonore totale.',550000.00,54,'[\"/uploads/produits/produit-1782908696797-316844686.png\"]',NULL,1,'2026-07-01 12:24:56'),
(18,6,3,'Sneakers Décontractées','Chaussures plates décontractées au design urbain et moderne. Elles se distinguent par des motifs imprimés style \"bandana / paisley\" vert olive et blanc, une conception respirante et légère, ainsi qu\'une semelle épaisse texturée arborant des détails typographiques originaux (\"LOOK FOR THE TAR\", \"DBWart\").',185000.00,58,'[\"/uploads/produits/produit-1783090672845-287140871.png\"]',NULL,1,'2026-07-03 14:57:52'),
(19,6,3,'Sneakers de Marche','Chaussures de marche et de style décontracté pour hommes, arborant un design classique noir et blanc inspiré des baskets de skate. Elles possèdent une tige en suède noir contrastée par une bande latérale blanche fluide, une semelle texturée blanche robuste et l\'inscription élégante \"MR.MESSI\" imprimée en lettres dorées sur le côté.',185000.00,5,'[\"/uploads/produits/produit-1783091026973-226926327.png\"]',NULL,1,'2026-07-03 15:03:47'),
(20,6,3,'Sneakers \"Chunky\" Robustes','Baskets au design \"chunky\" (semelle épaisse) ultra-tendance, déclinées dans un coloris entièrement noir (Full Black). Elles se démarquent par une semelle intermédiaire imposante et sculptée aux lignes agressives qui accentue leur style streetwear. La tige associe des empiècements en mesh respirant pour le confort et des textures synthétiques durables, le tout rehaussé par un système de laçage robuste et une petite étiquette décorative \"NEW STYLE\" sur le quartier latéral.',175000.00,74,'[\"/uploads/produits/produit-1783091177006-508124583.png\"]',NULL,1,'2026-07-03 15:06:17'),
(21,6,3,'Sandales Décontractées','Pantoufles / claquettes de style urbain idéales pour un look décontracté au quotidien. Elles se composent d\'une bride supérieure de couleur vert émeraude mat rehaussée de lignes géométriques blanches et de l\'inscription contrastée \"Superme\". La semelle intérieure noire est préformée et dotée de reliefs texturés antidérapants pour garantir un confort optimal et un excellent maintien du pied.',55000.00,86,'[\"/uploads/produits/produit-1783091996502-39901063.png\"]',NULL,1,'2026-07-03 15:19:56'),
(22,6,3,'Bottines de Travail Rétro','Bottines mi-hautes (mid-top) au design rétro inspiré des chaussures de travail, idéales pour un look urbain et décontracté. Elles se distinguent par une tige en suède noir rehaussée de surpiqûres blanches contrastées et d\'un col en maille tricotée beige au niveau de la cheville pour un maximum de confort. Ce modèle est équipé de lacets blancs robustes, d\'un écusson \"JEANS\" sur la languette et d\'une semelle plateforme crantée beige qui assure une excellente adhérence.',1750000.00,26,'[\"/uploads/produits/produit-1783093324459-925099763.png\"]',NULL,1,'2026-07-03 15:41:31'),
(23,6,3,'Baskets Montantes Décontractées','Chaussures montantes polyvalentes pour hommes au design résolument urbain et respirant. Elles se distinguent par une tige blanc cassé agrémentée d\'une illustration artistique de vagues traditionnelles sur le flanc, ainsi que par des empiècements gris-brun à motifs quadrillés au niveau du col de la cheville. Ce modèle intègre une semelle crantée robuste et texturée portant des inscriptions graphiques de style industriel telles que \"LOOK FOR THE STAR\" et \"DBWart The mainstream\".',195000.00,31,'[\"/uploads/produits/produit-1783094388344-752449411.png\"]',NULL,1,'2026-07-03 15:59:48'),
(24,6,3,'Sneakers Chunky Décontractées \"OEF-WHT\"','Chaussures de sport décontractées pour hommes, conçues pour être durables et respirantes. Elles se distinguent par une esthétique \"chunky\" moderne avec une semelle plateforme épaisse et sculptée aux formes ondulées. La tige de couleur blanc cassé intègre des empiècements marron camel, des sangles décoratives arborant l\'inscription \"OEF-WHT\", ainsi que des panneaux latéraux en tissu imprimé style collage/journal rétro agrémenté de touches rouges et bleues.',185000.00,5,'[\"/uploads/produits/produit-1783096715522-739560910.png\"]',NULL,1,'2026-07-03 16:38:35'),
(25,6,3,'Sabots Sportifs Futuristes','Sabots légers au look ultra-moderne et aérodynamique, parfaits pour la saison estivale et les sorties décontractées. La tige noire se démarque par ses motifs sculptés en vagues successives et ses larges fentes latérales qui garantissent une respirabilité maximale du pied. Le modèle est équipé d\'une bride de maintien grise ajustable munie d\'une boucle rapide et stylisée, arborant fièrement la mention \"FASHION\".',115000.00,54,'[\"/uploads/produits/produit-1783097020732-153465075.png\"]',NULL,1,'2026-07-03 16:43:40'),
(26,6,3,'Sneakers Basses Contrastées \"SIGNAL\"','Baskets de sport décontractées pour hommes, légères, confortables et respirantes. Elles adoptent un design bicolore noir et blanc intemporel, idéal pour un look \"street-chic\" quotidien. La tige se distingue par des panneaux latéraux blancs texturés de motifs géométriques gaufrés en relief, contrastés par des empiècements en cuir synthétique noir. La semelle plateforme blanche et robuste intègre une touche stylistique originale avec une grille de chiffres gravée discrètement sur le flanc, tandis que la languette arbore l\'étiquette \"SIGNAL\".',170000.00,64,'[\"/uploads/produits/produit-1783097132325-101908028.png\"]',NULL,1,'2026-07-03 16:45:32'),
(27,6,3,'Tennis Basses Légères \"Sport Tricolore','Chaussures de sport légères et décontractées pour hommes, parfaitement adaptées pour la marche quotidienne ou le fitness. Ce modèle bas de couleur blanche se distingue par son design épuré agrémenté de lignes tricolores dynamiques (bleu marine et rouge) sur le flanc latéral ainsi que sur l\'arrière de la semelle. Elles intègrent un empiècement assorti bleu marine au niveau du talon, l\'inscription décorative \"FASHION\" sur le quartier, un laçage blanc classique et un écusson \"SSSJ\" sur la languette.',125000.00,20,'[\"/uploads/produits/produit-1783097292627-177303560.png\"]',NULL,1,'2026-07-03 16:48:12'),
(28,6,3,'Baskets en Toile à Motifs Ethniques \"Fashion 1985\"','Chaussures basses en toile respirante offrant un design unique et coloré d\'inspiration ethnique. La tige est entièrement recouverte d\'un tissage de motifs géométriques en losanges et triangles combinant des teintes orange, bleu marine, jaune et vert sur un fond écru. Le modèle est dynamisé par des accents vert émeraude sur la languette, le contrefort arrière et à travers un insert en caoutchouc sur la semelle portant l\'inscription \"FASHION EST.1985\". Sa semelle plate blanche et ses lacets classiques assurent un confort doux et une grande légèreté au quotidien.',120000.00,35,'[\"/uploads/produits/produit-1783097447813-355116657.png\"]',NULL,1,'2026-07-03 16:50:47'),
(29,6,3,'Baskets de Sport Légères et Respirantes','Chaussures de sport basses à la fois légères, confortables et respirantes, idéales pour la marche, le running ou un style streetwear au quotidien. La tige combine une base en simili-cuir blanc avec des empiècements texturés en suède beige sur l\'avant et le contrefort arrière, ainsi que des vagues graphiques d\'un vert émeraude dynamique sur les flancs. Ce modèle est complété par des lacets blancs, l\'inscription \"SPORT\" sur la languette, un petit insert textile jaune contrastant près du laçage, et une semelle blanche amortissante soulignée d\'un liseré noir rigide au talon.',130000.00,69,'[\"/uploads/produits/produit-1783097650650-607270351.png\"]',NULL,1,'2026-07-03 16:54:10'),
(30,6,3,'Veste Coupe-Vent \"Greenland\" Tricolore','Veste légère de style coupe-vent pour homme, associant confort et tendance urbaine. Elle se démarque par un design graphique \"color-block\" en trois teintes parfaitement équilibrées : une base gris clair, une section intermédiaire en chevron vert sapin et des empiècements noirs unis sur le haut des épaules. Ce modèle à col montant dispose d\'une fermeture à glissière intégrale noire, de deux poches latérales pratiques sécurisées par des zips, ainsi que de finitions élastiques serrées aux poignets et à la taille pour une isolation optimale. Sa coupe moderne et décontractée est idéale pour la mi-saison et le quotidien.',325000.00,14,'[\"/uploads/produits/produit-1783097920425-119040593.png\"]',NULL,1,'2026-07-03 16:58:40'),
(31,6,3,'T-shirt Oversize Éco-Premium','T-Shirt à coupe ample (grande taille) et col rond classique, conçu à 100% en coton de qualité supérieure pour garantir un confort doux et une respirabilité maximale au quotidien. Ce modèle au design épuré est idéalement pensé pour la personnalisation par impression numérique, permettant d\'y apposer facilement des logos, des designs graphiques ou des visuels de marque. Il dispose d\'épaules tombantes ajustées pour un style décontracté et streetwear très recherché. Bien que présenté en blanc, le modèle se décline dans une riche palette de couleurs unies (terracotta, jaune moutarde, beige, gris, bleu marine).',95000.00,1,'[\"/uploads/produits/produit-1783098307125-469655751.png\"]',NULL,1,'2026-07-03 17:05:07'),
(32,6,3,'Qamis Saoudien Élégance \"Al Haramain\"','Splendide thobe de style saoudien traditionnel, coupe droite de longueur au sol avec des manches longues. Confectionné dans un tissu fluide, opaque et de grande qualité de couleur gris ardoise, il se distingue par ses finitions modernes et soignées. Le col montant rigide, la boutonnière centrale et les revers des poignets sont sublimés par des empiècements noirs texturés de fins motifs géométriques. L\'ensemble est rehaussé par des boutons carrés métalliques au fini brillant et une discrète poche poitrine dotée d\'une petite plaque décorative.',265000.00,14,'[\"/uploads/produits/produit-1783098502247-579986208.png\"]',NULL,1,'2026-07-03 17:08:22');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `roles` VALUES
(4,'admin'),
(1,'client'),
(2,'commerce'),
(3,'livreur');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `statuts_historique` VALUES
(1,1,'en_attente','Commande créée','2026-06-27 14:24:33'),
(2,2,'en_attente','Commande créée','2026-06-28 17:52:51'),
(3,1,'confirmee',NULL,'2026-06-29 21:56:29'),
(4,1,'en_preparation',NULL,'2026-06-29 21:56:32'),
(5,1,'prete',NULL,'2026-06-29 21:56:36'),
(6,1,'en_livraison','Livreur assigné','2026-06-29 21:58:20');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `utilisateur_roles` VALUES
(6,4,'2026-06-30 14:43:02'),
(7,2,'2026-06-30 14:43:02'),
(8,2,'2026-06-30 14:43:02'),
(9,2,'2026-06-30 14:43:02'),
(10,1,'2026-06-30 14:43:02'),
(11,1,'2026-06-30 14:43:02'),
(12,1,'2026-06-30 14:43:02'),
(13,1,'2026-06-30 14:43:02'),
(13,2,'2026-07-03 14:44:56'),
(14,1,'2026-06-30 14:43:02'),
(15,3,'2026-06-30 14:43:02'),
(16,3,'2026-06-30 14:43:03');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT INTO `utilisateurs` VALUES
(6,'Panafrikaka','Kevin','M','admin@addugo.com','$2b$10$MeWGhRuk4KQQcmEq8OqSSu99iOxTcnbK9/0JEJTLA5b2qdo48PT26',NULL,NULL,'/uploads/profils/profil-1782830866831-369572155.png',1,'2026-06-30 14:43:02','2026-06-30 14:47:46'),
(7,'Kaba','Nema','M','user01@addugo.com','$2b$10$gu3m0ywKWShY/27tumeNDuu9zYI2ewX6UHYznyID3FywE2RYV9KjS',NULL,NULL,'/uploads/profils/profil-1782835351340-965380402.png',1,'2026-06-30 14:43:02','2026-06-30 16:02:31'),
(8,'Daffe','Fanta','M','user02@addugo.com','$2b$10$16plTOChqSHS5v1s41CyXeWsZND1G8Vx.zXAnsuKhL/sMxRdTWuR6',NULL,NULL,NULL,1,'2026-06-30 14:43:02','2026-06-30 14:43:02'),
(9,'Bah','Aliou','M','user03@addugo.com','$2b$10$iBB0HNgHF5B74CUSAFi2welZVaIb93oHqj/nhoyFktgD49EJCw4sW',NULL,NULL,NULL,1,'2026-06-30 14:43:02','2026-06-30 14:43:02'),
(10,'Koivogui','Bidy','M','user04@addugo.com','$2b$10$2x6sWYO8FwREnyIyYHd.ZuW0vIBvhYAHpe8EcluWsF6ysvMYki10y',NULL,NULL,NULL,1,'2026-06-30 14:43:02','2026-06-30 14:43:02'),
(11,'Camara','Abdoulaye','M','user05@addugo.com','$2b$10$/oGT2.yIgAPwEbdK.8df6OTmHUHqVTsiJN9GrYEm3My3vYpMvM7z6',NULL,NULL,NULL,1,'2026-06-30 14:43:02','2026-06-30 14:43:02'),
(12,'Kante','Mamfila','M','user06@addugo.com','$2b$10$2WYaMzztE9MpVtipyJFtreiLchQHTn2d0loVXGQd5MtBMkwBxMO8C',NULL,NULL,NULL,1,'2026-06-30 14:43:02','2026-06-30 14:43:02'),
(13,'Sankara','Thomas','M','user07@addugo.com','$2b$10$qEcYEmZNb0UrDqTJcozrWOQFemp8shxUKnX/8pQjqIAE49CmaJQd2','+224 662 66 40 85','Conakry','/uploads/profils/profil-1783089385168-943174859.png',1,'2026-06-30 14:43:02','2026-07-03 14:37:07'),
(14,'Diallo','Kadiatou','F','user08@addugo.com','$2b$10$JWIKx2Z4thaJPYkCCt7pveTVyP/MpfrxMArafiXeUQHjjyROLZT.y','+224 625 98 64 31','Conakry','/uploads/profils/profil-1783159792683-949591890.png',1,'2026-06-30 14:43:02','2026-07-04 10:10:33'),
(15,'Sow','Binta','F','user09@addugo.com','$2b$10$Tyq/2DnhdFlSXrBAS8FCVO7CjpLrH0.R4JMmntfrXNXs2c2faxgLC','+224 614 47 46 94','Conakry','/uploads/profils/profil-1783011188540-935154924.png',1,'2026-06-30 14:43:02','2026-07-03 10:06:13'),
(16,'Toure','Kwame','M','user10@addugo.com','$2b$10$l3m6F8tjn4qCHpJA.YW.IOeBxnrd09yFmaY8tscUNHo8fl2Wne6s.',NULL,NULL,NULL,1,'2026-06-30 14:43:03','2026-06-30 14:43:03');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
SET FOREIGN_KEY_CHECKS=1; 
