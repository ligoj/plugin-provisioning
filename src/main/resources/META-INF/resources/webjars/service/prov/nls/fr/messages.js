define({
	'service:prov' : 'Provisionnement',
    'service:prov:manage': 'Gérer',
    'service:prov:instances-block': 'Instances',
    'service:prov:storages-block': 'Stockages',
    'service:prov:os': 'OS',
    'service:prov:os-title': 'Système d\'exploitation',
    'service:prov:os-help': 'Système d\'exploitation pré-installé pour cette instance. Le prix de l\'instance inclue la licence correspondante, et est souvent en relation avec la quantité de CPU',
    'service:prov:cpu': 'CPU',
    'service:prov:cpu-any': 'Importe',
    'service:prov:cpu-variable': 'Variable',
    'service:prov:cpu-constant': 'Constant',
    'service:prov:cpu-title': 'Système d\'exploitation',
    'service:prov:cpu-help': 'Le CPU demandé. La meilleure instance correspondante à cette exigence peut inclure plus que cette quantité. Il est alors important de bien équilibrer la resource (CPU/RAM) pour limiter cette perte.<div class=\'text-left\'><i class=\'fa fa-bolt fa-fw\'></i> CPU variable, dispose de crédit turbo.<br><i class=\'fa fa-minus fa-fw\'></i> CPU constant delivre une puissance continue.</div>',
    'service:prov:ram': 'RAM',
    'service:prov:ram-mega': 'Mo',
    'service:prov:ram-giga': 'Go',
    'service:prov:ram-help': 'La mémoire demandée. La meilleure instance correspondante à cette exigence peut inclure plus que cette quantité. Il est alors important de bien équilibrer la resource (CPU/RAM) pour limiter cette perte',
    'service:prov:instance-name': 'Serveur',
    'service:prov:instance-name-title': 'Nom logique serveur',
    'service:prov:instance-quantity' : 'Quantité',
    'service:prov:instance-quantity-to': 'à',
    'service:prov:instance-quantity-help' : 'Quantité pour cette instance. Les stockages associés et le coût total reflèteront cette quantité',
    'service:prov:instance': 'Instance',
    'service:prov:instance-title': 'Type de VM avec ressources prédéfinies',
    'service:prov:instance-help': 'La meilleur instance répondant aux ressources demandées',
    'service:prov:instance-custom': 'Instance personnalisée',
    'service:prov:instance-custom-title': 'Type de VM avec des ressources personnalisées',
    'service:prov:instance-deleted': 'Instance "{{[0]}}" ({{[1]}}) est supprimée',
    'service:prov:instance-cleared': 'Toutes les instances et leurs stockages attachés ont été supprimées',
	'service:prov:instance-choice' : 'La meilleure instance du fournisseur sera choisie en fonction des exigences exprimées',
    'service:prov:instance-type': 'Type',
    'service:prov:instance-type-title': 'Type d\'instance du fournisseur',
    'service:prov:instance-max-variable-cost': 'Coût max',
    'service:prov:instance-max-variable-cost-title': 'Coût maximum où cette instance sera valide',
    'service:prov:instance-max-variable-cost-help': 'Coût maximum optionnel où cette instance sera valide. Lorsque non définie, il n\'y a pas de limite. Lorsque ce seuil est atteint, l\'instance serait supprimée.',
    'service:prov:internet': 'Accès Internet', 
    'service:prov:internet-title': 'Accès Internet depuis/vers cette instance', 
    'service:prov:internet-help': 'Option d\'accès Internet. Une accès public implique une instance frontale Internet.', 
    'service:prov:price-type': 'Utilisation',
    'service:prov:price-type-title': 'Condition de prix et utilisation',
    'service:prov:price-type-help': 'Condition de prix, période et contrat. En général, plus le contrat est court et plus il est cher',
    'service:prov:price-type-upload': 'Utilisation par défaut',
    'service:prov:price-type-upload-help': 'Condition de prix, période et contrat utilisé lorsqu\'aucune condition n\'est présente dans le fichier importé. plus le contrat est court et plus il est cher.',
    'service:prov:memory-unit-upload': 'Unité mémoire',
    'service:prov:memory-unit-upload-help': 'Unité mémoire pour la RAM dans le fichier importé',
    'service:prov:storage': 'Stockage',
    'service:prov:storage-title': 'Taille du stockage, en Go',
    'service:prov:storage-type': 'Type',
    'service:prov:storage-type-title': 'Type de stockage du fournisseur',
    'service:prov:storage-frequency': 'Fréquence',
    'service:prov:storage-frequency-help': 'La fréquence d\'accès aux données du stockage',
    'service:prov:storage-frequency-title': 'Fréquence d\'accès au stockage',
    'service:prov:storage-frequency-cold': 'Froid',
    'service:prov:storage-frequency-cold-title': 'Accès non fréquent, latence élevée. Non compatible pour le boot des instances',
    'service:prov:storage-frequency-hot': 'Chaud',
    'service:prov:storage-frequency-hot-title': 'Accès fréquent, latence faible ou moyenne',
    'service:prov:storage-frequency-archive': 'Archive',
    'service:prov:storage-frequency-archive-title': 'Accès très peu fréquent, ou latence très élevée. Non compatible pour des instances',
    'service:prov:storage-select': 'Taille du stockage en Go',
    'service:prov:storage-optimized': 'Optimisé',
    'service:prov:storage-optimized-title': 'Optimisation du stockage',
    'service:prov:storage-optimized-help': 'Ce qui est le plus important for ce stockage',
    'service:prov:storage-optimized-throughput': 'Débit' ,
    'service:prov:storage-optimized-throughput-title': 'Volume des échanges de données, généralement basé sur du stockage de type HDD',
    'service:prov:storage-optimized-iops': 'IOPS',
    'service:prov:storage-optimized-iops-title': 'I/O par second, généralement basé sur du stockage de type SSD',
    'service:prov:storage-instance-title' : 'Instance associée à ce stockage. Sera supprimée lorsque cette instance le sera, même leur cycle de vie sont indépendants à l\'exécution',
	'service:prov:storage-instance-help' : 'Instance associée',
    'service:prov:storage-size': 'Taille',
    'service:prov:storage-size-title': 'Taille du bloc en Go',
    'service:prov:storage-deleted': 'Stockage "{{[0]}}" ({{[1]}}) est supprimé',
    'service:prov:storage-cleared': 'Tous les stockages ont été supprimés',
    'service:prov:cost': 'Coût',
    'service:prov:cost-title': 'Facturés par mois',
    'service:prov:resources': 'Ressources',
    'service:prov:total-ram': 'Mémoire totale',
    'service:prov:total-cpu': 'CPU total',
    'service:prov:total-storage': 'Stockage total',
    'service:prov:nb-instances': 'Nombre d\'instances',
    'service:prov:cost-month': 'Mois',
    'service:prov:efficiency-title': 'Efficacité globale de cette demande : CPU, RAM et stockage',
    'service:prov:price-type-lowest': 'Plus efficace, auto',
    'service:prov:terraform:execute': 'Exécuter',
    'service:prov:terraform:started': 'Terraform démarré',
    'instance-import-message': 'Importer des instances depuis un fichier CSV, <code> ;</code> comme séparateur',
    'instance-import-sample': 'Exemple',
    'service:prov:cost-refresh-title': 'Raffraichir (calcul complet) le coût global',
    'service:prov:refresh-needed': 'Le coût global a chnagé,rechargement des détails ...'
});
