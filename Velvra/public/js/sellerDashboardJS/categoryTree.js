const CATEGORY_TREE_DATA = [
    {
        name: 'Fashion',
        children: [
            {
                name: 'Women',
                children: [
                    {
                        name: 'Clothing',
                        children: [
                            { name: 'Dresses' },
                            { name: 'Skirts' },
                            { name: 'Socks & Tights' },
                            {
                                name: 'Swimwear & Beachwear',
                                children: [
                                    { name: 'Beachwear & Accessories' },
                                    { name: 'Bikinis' },
                                    { name: 'Swimsuits' }
                                ]
                            },
                            { name: 'Jeans' },
                            {
                                name: 'Tops',
                                children: [
                                    { name: 'Tanks & Camisoles' },
                                    { name: 'T-Shirts' },
                                    { name: 'Shirts' },
                                    { name: 'Tunics' }
                                ]
                            },
                            { name: 'Sweaters & Cardigans' },
                            {
                                name: 'Pants & Leggings',
                                children: [
                                    { name: 'Chinos' },
                                    { name: 'Pants' },
                                    { name: 'Leggings' },
                                    { name: 'Joggers' },
                                    { name: 'Jeggings' }
                                ]
                            },
                            {
                                name: 'Jackets & Coats',
                                children: [
                                    { name: 'Blazers & Vests' },
                                    { name: 'Denim Jackets' },
                                    { name: 'Leather & Faux Leather Jackets' },
                                    { name: 'Winter Jackets & Coats' },
                                    { name: 'Rain Coats & Trenches' },
                                    { name: 'Lightweight Jackets' },
                                    { name: 'Fur & Faux Fur Jackets' },
                                    { name: 'Down Jackets' },
                                    { name: 'Bomber Jackets' }
                                ]
                            },
                            { name: 'Jumpsuits & Playsuits' },
                            { name: 'Hoodies & Sweatshirts' },
                            {
                                name: 'Traditional Clothing',
                                children: [
                                    { name: 'Unstitched Fabric' },
                                    {
                                        name: 'Kurtas & Shalwar Kameez',
                                        children: [
                                            { name: 'Shalwar Kameez' },
                                            { name: 'Kurtis' },
                                            { name: 'Shalwar & Pyjamas' }
                                        ]
                                    },
                                    {
                                name: 'Formal Wear',
                                children: [
                                    { name: 'Blouses' },
                                    { name: 'Bridal Dress' },
                                    { name: 'Party Wear' },
                                    { name: 'Sarees' }
                                ]
                                    },
                                    { name: 'Palazzo Pants & Culottes' },
                                    { name: 'Dupattas Stoles & Shawls' }
                                ]
                            },
                            {
                                        name: 'Shorts',
                                        children: [
                                            { name: 'Denim' },
                                            { name: 'Tailored' },
                                            { name: 'Casual' }
                                        ]
                            },
                            {
                                name: 'Plus Size',
                                children: [
                                    { name: 'Dresses' },
                                    { name: 'Tops' },
                                    { name: 'Bottoms' }
                                ]
                            },
                            {
                                name: 'Intimates',
                                children: [
                                    { name: 'Swimwear' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Shoes',
                        children: [
                            {
                                name: 'Heels',
                                children: [
                                    { name: 'Pumps' },
                                    { name: 'Heeled Sandals' },
                                    { name: 'Mules' }
                                ]
                            },
                            {
                                name: 'Sandals',
                                children: [
                                    { name: 'Flat Sandals' },
                                    {
                                        name: 'Slides & Flip Flops',
                                        children: [
                                            { name: 'Slides' },
                                            { name: 'Flip Flops' }
                                        ]
                                    },
                                    { name: 'House Slippers' }
                                ]
                            },
                            { name: 'Sneakers' },
                            {
                                name: 'Flat Shoes',
                                children: [
                                    { name: 'Ballet Flats' },
                                    { name: 'Boat Shoes & Loafers' },
                                    { name: 'Slip-Ons' },
                                    { name: 'Oxfords & Lace-Ups' },
                                    { name: 'Mary Janes' }
                                ]
                            },
                            {
                                name: 'Wedges',
                                children: [
                                    { name: 'Wedge Sandals' },
                                    { name: 'Closed-Toe Wedges' },
                                    { name: 'Slides & Mules' }
                                ]
                            },
                            {
                                name: 'Boots',
                                children: [
                                    { name: 'Winter Boots' },
                                    { name: 'Rain Boots' }
                                ]
                            },
                            {
                                name: 'Shoes Accessories',
                                children: [
                                    { name: 'Khussa & Kohlapuri' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Accessories',
                        children: [
                            { name: 'Belts' },
                            { name: 'Hats & Caps' },
                            { name: 'Hair Accessories' },
                            { name: 'Umbrellas' },
                            { name: 'Scarves & Mufflers' },
                            { name: 'Gloves' },
                            { name: 'Masks' }
                        ]
                    },
                    {
                        name: 'Lingerie, Sleep & Lounge',
                        children: [
                            { name: 'Bras' },
                            { name: 'Panties' },
                            { name: 'Sexy Lingerie' },
                            { name: 'Shapewear' },
                            { name: 'Sleep & Loungewear' },
                            { name: 'Robes & Bodysuits' },
                            { name: 'Lingerie Sets' },
                            { name: 'Camisoles & Slips' },
                            { name: 'Bodysuits' },
                            { name: 'Lingerie Accessories' },
                            { name: 'Thermal & Shapewear' }
                        ]
                    }
                ]
            },
            {
                name: 'Men',
                children: [
                    {
                        name: 'Clothing',
                        children: [
                            {
                                name: 'Sweaters & Cardigans',
                                children: [
                                    { name: 'Sweaters' },
                                    { name: 'Cardigans' }
                                ]
                            },
                            {
                                name: 'Jackets & Coats',
                                children: [
                                    { name: 'Denim Jackets' },
                                    { name: 'Leather Jackets' },
                                    { name: 'Bomber Jackets' },
                                    { name: 'Lightweight Jackets' },
                                    { name: 'Winter Jackets & Coats' },
                                    { name: 'Rain Coats & Trenches' },
                                    { name: 'Down Jackets' }
                                ]
                            },
                            { name: 'Jeans' },
                            {
                                name: 'Suits',
                                children: [
                                    { name: 'Suits' },
                                    { name: 'Suit Jackets' },
                                    { name: 'Suit Pants' },
                                    { name: 'Waistcoats & Vests' }
                                ]
                            },
                            { name: 'Swimwear' },
                            {
                                name: 'Pants',
                                children: [
                                    { name: 'Chinos' },
                                    { name: 'Cargo' },
                                    { name: 'Joggers & Sweats' },
                                    { name: 'Harem Pants' }
                                ]
                            },
                            {
                                name: 'Casual Tops',
                                children: [
                                    { name: 'T-Shirts' },
                                    { name: 'Tanks' }
                                ]
                            },
                            {
                                name: 'Underwear',
                                children: [
                                    { name: 'Briefs' },
                                    { name: 'Nightwear' },
                                    { name: 'Thongs & Others' },
                                    { name: 'Trunks & Boxers' },
                                    { name: 'Thermal' }
                                ]
                            },
                            {
                                name: 'Shirts',
                                children: [
                                    { name: 'Casual Shirts' },
                                    { name: 'Formal Shirts' },
                                    { name: 'Polo T-Shirts' }
                                ]
                            },
                            {
                                name: 'Traditional Clothing',
                                children: [
                                    { name: 'Lungi' },
                                    { name: 'Kurtas' },
                                    { name: 'Sherwani' },
                                    { name: 'Unstitched Fabric' },
                                    { name: 'Shawls' }
                                ]
                            },
                            {
                                name: 'Shorts',
                                children: [
                                    { name: 'Casual' },
                                    { name: 'Denim' }
                                ]
                            },
                            { name: 'Socks' },
                            { name: 'Hoodies & Sweatshirts' },
                            { name: 'Tracksuits' }
                        ]
                    },
                    {
                        name: 'Shoes',
                        children: [
                            { name: 'Sneakers' },
                            {
                                name: 'Flip Flops & Sandals',
                                children: [
                                    { name: 'House Slippers' },
                                    { name: 'Flip Flops' },
                                    { name: 'Sandals' },
                                    { name: 'Slides' }
                                ]
                            },
                            {
                                name: 'Boots',
                                children: [
                                    { name: 'Ankle Boots' },
                                    { name: 'Cowboy & Biker Boots' },
                                    { name: 'Rain Boots' }
                                ]
                            },
                            { name: 'Shoes Accessories' },
                            { name: 'Formal Shoes' },
                            {
                                name: 'Khusa & Kolapuri',
                                children: [
                                    { name: 'Kohlapuris' },
                                    { name: 'Slip-Ons & Loafers' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Accessories',
                        children: [
                            {
                                name: 'Ties & Bow Ties',
                                children: [
                                    { name: 'Ties' },
                                    { name: 'Bow Ties' }
                                ]
                            },
                            { name: 'Scarves' },
                            { name: 'Umbrellas' },
                            { name: 'Belts' },
                            { name: 'Hats & Caps' },
                            { name: 'Gloves' },
                            { name: 'Braces' },
                            { name: 'Masks' }
                        ]
                    },
                    { name: 'Ethnic Wear' }
                ]
            },
            {
                name: 'Girls',
                children: [
                    {
                        name: 'Shoes',
                        children: [
                            { name: 'Sneakers' },
                            { name: 'Formal Shoes' },
                            { name: 'Flats & Slip-Ons' },
                            { name: 'Boots' },
                            { name: 'Shoes Accessories' },
                            { name: 'Flip Flops, Slides & Sandals' }
                        ]
                    },
                    {
                        name: 'Accessories',
                        children: [
                            { name: 'Belts' },
                            { name: 'Hats & Caps' },
                            { name: 'Umbrellas & Rainwear' },
                            { name: 'Gloves' },
                            { name: 'Hair Accessories' }
                        ]
                    },
                    {
                        name: 'Clothing',
                        children: [
                            { name: 'Tops' },
                            { name: 'Bottoms' },
                            { name: 'Dresses' },
                            { name: 'Sweaters & Cardigans' },
                            { name: 'Jackets & Coats' },
                            { name: 'Socks & Tights' },
                            { name: 'Underwear & Sleepwear' },
                            { name: 'Shorts' },
                            { name: 'Hoodies' },
                            { name: 'Swimsuits' }
                        ]
                    }
                ]
            },
            {
                name: 'Boys',
                children: [
                    {
                        name: 'Shoes',
                        children: [
                            { name: 'Sneakers' },
                            { name: 'Formal Shoes' },
                            { name: 'Slip-Ons & Loafers' },
                            { name: 'Boots' },
                            { name: 'Shoes Accessories' },
                            { name: 'Flip Flops, Slides & Sandals' }
                        ]
                    },
                    {
                        name: 'Accessories',
                        children: [
                            { name: 'Belts' },
                            { name: 'Hats & Caps' },
                            { name: 'Umbrellas & Rainwear' },
                            {
                                name: 'Others',
                                children: [
                                    { name: 'Gloves, Scarves & Cold Weather' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Clothing',
                        children: [
                            { name: 'T-Shirts & Shirts' },
                            { name: 'Pants & Jeans' },
                            { name: 'Sweaters & Cardigans' },
                            { name: 'Jackets & Coats' },
                            {
                                name: 'Underwear & Socks',
                                children: [
                                    { name: 'Underwear' },
                                    { name: 'Socks' }
                                ]
                            },
                            { name: 'Sleepwear' },
                            { name: 'Shorts' },
                            { name: 'Kurtas & Shalwar Kameez' },
                            { name: 'Hoodies' },
                            { name: 'Swimwear' }
                        ]
                    }
                ]
            },
            {
                name: 'Unisex',
                children: [
                    {
                        name: 'Clothing',
                        children: [
                            { name: 'Hoodies & Sweatshirts' },
                            { name: 'Couple & Family Sets' },
                            { name: 'T-Shirts' },
                            { name: 'Shirts' },
                            { name: 'Cardigans & Sweaters' },
                            { name: 'Hoodies & Sweatshirts' },
                            { name: 'Beachwear' },
                            { name: 'Shirts' },
                            { name: 'Cardigans & Sweaters' },
                            { name: 'T-Shirts' },
                            { name: 'Unstitched Fabric' }
                        ]
                    },
                    {
                        name: 'Accessories',
                        children: [
                            { name: 'Hats & Caps' }
                        ]
                    },
                    {
                        name: 'Shoes',
                        children: [
                            { name: 'Sneakers' },
                            { name: 'Shoes Accessories' },
                            {
                                name: 'Flip Flops & Sandals',
                                children: [
                                    { name: 'Flip Flops' },
                                    { name: 'House Slippers' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Kids',
                children: [
                    {
                        name: 'Unisex',
                        children: [
                            {
                                name: 'Accessories',
                                children: [
                                    { name: 'Belts' },
                                    { name: 'Hats & Caps' },
                                    { name: 'Gloves, Scarves & Cold Weather' },
                                    { name: 'Umbrellas & Rainwear' }
                                ]
                            },
                            {
                                name: 'Clothing',
                                children: [
                                    { name: 'Hoodies' }
                                ]
                            },
                            {
                                name: 'Shoes',
                                children: [
                                    { name: 'Sneakers' },
                                    { name: 'Shoes Accessories' },
                                    { name: 'Flip Flops, Slides & Sandals' },
                                    { name: 'Rain Boots' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];
function addUniqueIdsToTree(tree, parentId = '') {
    let idCounter = 0;
    function traverse(nodes, parentId) {
        nodes.forEach((node, idx) => {
            node._id = parentId + '-' + (node.name || 'unnamed') + '-' + idx;
            if (node.children) {
                traverse(node.children, node._id);
            }
        });
    }
    traverse(tree, parentId);
}
addUniqueIdsToTree(CATEGORY_TREE_DATA);
function advancedCategorySelector() {
    return {
        tree: CATEGORY_TREE_DATA,
        columns: [],
        selectedPath: [],
        init() {
            // Only show the root node(s) in the first column on load
            this.columns = [{ items: this.tree, filter: '' }];
            this.selectedPath = [];
            if (window.Alpine) Alpine.store('categorySelector', this);
        },
        select(level, item) {
            // Prevent re-selecting the same node at the next level
            if (this.selectedPath[level] && this.selectedPath[level]._id === item._id) return;

            this.columns.splice(level + 1);
            this.selectedPath.splice(level);
            this.selectedPath.push(item);
            this.selectedPath = [...this.selectedPath];
            if (window.Alpine) Alpine.store('categorySelector', this);

            if (item.children && item.children.length > 0) {
                this.columns.push({ items: item.children, filter: '' });

                // Auto-scroll to the rightmost column
                this.$nextTick(() => {
                    const container = this.$refs.categoryScroll;
                    if (container) {
                        container.scrollTo({
                            left: container.scrollWidth,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        },
        isActive(level, itemName) {
            return this.selectedPath[level] && this.selectedPath[level].name === itemName;
        },
        getFilteredItems(column) {
            if (!column || !Array.isArray(column.items)) return [];
            if (!column.filter) return column.items;
            return column.items.filter(item =>
                item.name && item.name.toLowerCase().includes(column.filter.toLowerCase())
            );
        },
        clearSelection() {
            this.selectedPath = [];
            this.columns = [];
            this.init();
            if (window.Alpine) Alpine.store('categorySelector', this);
        }
    }
}
