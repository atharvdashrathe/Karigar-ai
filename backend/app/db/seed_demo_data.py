"""
Section 18: deterministic demo data so the dashboard/products/orders screens
have something real to show even before the AI pipeline phases (2-6) exist,
and so the whole app is demoable offline. Every seeded value is realistic but
explicitly synthetic — nothing here is presented as real market data.

Run standalone with: python -m app.db.seed_demo_data
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal, init_db
from app.models.appreciation import Appreciation
from app.models.collective import ArtisanCollective
from app.models.enquiry import Enquiry
from app.models.operations import Order
from app.models.product import Product
from app.models.story import ArtisanStory
from app.models.user import ArtisanProfile, User

logger = get_logger(__name__)

DEMO_PHONE = "+91-9999900000"

DEMO_PRODUCTS = [
    dict(
        product_name="Handmade Bamboo Basket",
        category="Home Décor",
        description="A hand-woven bamboo storage basket made using traditional weaving techniques.",
        materials="Bamboo",
        dimensions="30cm x 25cm x 20cm",
        colour="Natural brown",
        craft_type="Bamboo weaving",
        language="hi",
        english_description="A hand-woven bamboo storage basket made using traditional weaving techniques, suitable for home organization and décor.",
        hindi_description="पारंपरिक बुनाई तकनीक से बना हाथ से बुना हुआ बांस का टोकरी, घर की सजावट और भंडारण के लिए उपयुक्त।",
        keywords="bamboo, handwoven, storage, basket, eco-friendly",
        tags="home décor, sustainable, handmade",
        price=699, minimum_price=650, maximum_price=800, production_cost=420, estimated_margin=279, confidence=0.86,
        inventory_count=12, listing_score=88, status="published",
    ),
    dict(
        product_name="Hand-Painted Canvas Artwork",
        category="Art & Paintings",
        description="An original watercolour painting on canvas, hand-painted by the artisan.",
        materials="Watercolour, Canvas",
        dimensions="40cm x 30cm",
        colour="Multicolour",
        craft_type="Painting",
        language="mr",
        english_description="An original watercolour painting on canvas, hand-painted by the artisan, suitable for wall art and gifting.",
        hindi_description="कलाकार द्वारा हाथ से बनाई गई एक मूल जल रंग पेंटिंग, दीवार की सजावट और उपहार के लिए उपयुक्त।",
        keywords="painting, watercolour, wall art, handmade art",
        tags="art, home décor, gifting",
        price=1450, minimum_price=1300, maximum_price=1700, production_cost=650, estimated_margin=800, confidence=0.81,
        inventory_count=3, listing_score=91, status="published",
    ),
    dict(
        product_name="Handcrafted Leather Wallet",
        category="Bags & Accessories",
        description="A genuine leather wallet, hand-stitched with traditional tanning methods.",
        materials="Leather",
        dimensions="11cm x 9cm",
        colour="Tan brown",
        craft_type="Leather craft",
        language="hi",
        english_description="A genuine leather wallet, hand-stitched with traditional tanning methods, featuring multiple card slots and cash compartment.",
        hindi_description="पारंपरिक टैनिंग विधियों से हाथ से सिला हुआ असली चमड़े का बटुआ, जिसमें कई कार्ड स्लॉट और कैश कम्पार्टमेंट हैं।",
        keywords="leather, wallet, hand-stitched, handcrafted, genuine leather",
        tags="accessories, leather goods, everyday carry",
        price=899, minimum_price=800, maximum_price=1100, production_cost=450, estimated_margin=449, confidence=0.84,
        inventory_count=8, listing_score=85, status="published",
    ),
    dict(
        product_name="Heritage Brass Diya Lamp",
        category="Artisan Jewellery",
        description="A traditional handcrafted brass oil lamp with fine engraving.",
        materials="Brass",
        dimensions="15cm x 15cm x 20cm",
        colour="Antique Gold",
        craft_type="Brass & Metal Craft",
        language="hi",
        english_description="A traditional handcrafted brass oil lamp with intricate engravings, ideal for festive décor and pooja rooms.",
        hindi_description="बारीक नक्काशी के साथ पारंपरिक हस्तनिर्मित पीतल का तेल का दीया, उत्सव की सजावट और पूजा कक्ष के लिए आदर्श।",
        keywords="brass, diya, pooja, festive, traditional, metal craft",
        tags="pooja, home décor, festive, metal craft",
        price=1299, minimum_price=1150, maximum_price=1500, production_cost=620, estimated_margin=679, confidence=0.88,
        inventory_count=6, listing_score=94, status="published",
    ),
    dict(
        product_name="Hand-carved Sheesham Bowl",
        category="Wooden Crafts",
        description="A rustic wooden serving bowl carved from single-piece seasoned sheesham wood.",
        materials="Sheesham Wood",
        dimensions="22cm diameter x 8cm",
        colour="Deep Walnut",
        craft_type="Wood Carving",
        language="hi",
        english_description="A rustic wooden serving bowl carved from seasoned sheesham wood with food-safe natural oil finish.",
        hindi_description="सीज़न्ड शीशम की लकड़ी से तराशा गया देहाती लकड़ी का सर्विंग बाउल, खाद्य-सुरक्षित प्राकृतिक तेल फिनिश के साथ।",
        keywords="wood, carved bowl, sheesham, tableware, handmade",
        tags="tableware, kitchen, wooden craft",
        price=850, minimum_price=750, maximum_price=1050, production_cost=380, estimated_margin=470, confidence=0.85,
        inventory_count=9, listing_score=89, status="published",
    ),
]

DEMO_ENQUIRIES = [
    {
        "buyer_name": "Meera Shah",
        "buyer_contact": "+91 98201 45892",
        "product_name": "Handmade Bamboo Basket",
        "message": "I'm interested in ordering 50 units for a corporate festival hamper. Can you deliver to Mumbai by the 20th?",
        "status": "new",
    },
    {
        "buyer_name": "Arjun Rao",
        "buyer_contact": "+91 94481 23091",
        "product_name": "Handmade Bamboo Basket",
        "message": "Do you make a smaller nested size? Looking for 20 pieces monthly for our lifestyle boutique in Bengaluru.",
        "status": "new",
    },
    {
        "buyer_name": "Nisha Kamat",
        "buyer_contact": "nisha.kamat@weavestore.in",
        "product_name": "Hand-carved Sheesham Bowl",
        "message": "Please share wholesale pricing and packaging options for a bulk batch of 30 bowls for our Pune outlet.",
        "status": "responded",
        "response_message": "Hello Nisha, thank you for your interest! For 30 units, we can offer wholesale rate of ₹680 per piece with bubble-wrap packaging.",
    },
    {
        "buyer_name": "Farhan Qureshi",
        "buyer_contact": "+91 98110 54321",
        "product_name": "Heritage Brass Diya Lamp",
        "message": "Sample piece arrived safely in Delhi. Excellent polishing quality! Placing full order of 15 units.",
        "status": "completed",
        "response_message": "Thank you Farhan ji! Glad you loved the craftsmanship. Your 15 units order is packed and dispatched.",
    },
]


def seed(db: Session) -> ArtisanProfile:
    existing_user = db.query(User).filter(User.phone_number == DEMO_PHONE).first()
    artisan = None

    if existing_user and existing_user.artisan_profile:
        artisan = existing_user.artisan_profile
        logger.info("Demo artisan profile present.")
    else:
        user = User(phone_number=DEMO_PHONE, display_name="Sita Handloom")
        db.add(user)
        db.flush()

        # Seed Craft Collectives
        kolhapur_collective = ArtisanCollective(
            name="Kolhapur Artisan Collective",
            slug="kolhapur-artisan-collective",
            location="Kolhapur, Maharashtra",
            state="Maharashtra",
            craft_type="Traditional Leather & Metal Crafts",
            description="A renowned cooperative of 24 rural leather craft artisans and brass metalsmiths preserving century-old generational heritage.",
            image_url="https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=600&auto=format&fit=crop&q=80",
            artisan_count=24,
            is_verified=True,
        )
        kutch_collective = ArtisanCollective(
            name="Kutch Heritage Weavers Sangha",
            slug="kutch-heritage-weavers",
            location="Bhuj, Gujarat",
            state="Gujarat",
            craft_type="Handloom & Bandhani Textiles",
            description="Empowering over 40 women handloom weavers crafting authentic GI-tagged organic cotton and natural indigo sarees.",
            image_url="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
            artisan_count=42,
            is_verified=True,
        )
        db.add_all([kolhapur_collective, kutch_collective])
        db.flush()

        artisan = ArtisanProfile(
            user_id=user.id,
            name="Savita Patil",
            preferred_language="mr",
            location="Sangli, Maharashtra",
            state="Maharashtra",
            village="Walwa",
            craft_type="Traditional Handicrafts",
            experience_years=12,
            business_name="Patil Handicrafts & Textiles",
            bio="Master artisan specializing in sustainable bamboo weaving and rural home crafts. Learned the craft from her mother and has trained over 30 women in her village.",
            is_verified=True,
            collective_id=kolhapur_collective.id,
        )
        db.add(artisan)
        db.flush()

        # Seed Artisan Story (Meet the Maker)
        story = ArtisanStory(
            artisan_id=artisan.id,
            title="Weaving Life with Bamboo: Savita's Heritage",
            story_text=(
                "Born in Walwa village near Sangli, Savita grew up watching her grandmother weave sturdy bamboo "
                "storage baskets for local grain farmers. Today, she combines these traditional knotting techniques "
                "with modern contemporary designs, creating zero-waste, sustainable home décor. "
                "Every purchase directly supports her women's craft self-help group in Maharashtra."
            ),
            craft_tradition="Generational Bamboo Weaving & Natural Fibre Craft",
            generations_in_craft=3,
            audio_story_url="https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg",
            audio_duration_seconds=48,
            cover_image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
            quote="When you hold a bamboo basket, you hold thirty years of patience and the scent of our soil.",
            is_published=True,
        )
        db.add(story)

        products = []
        for i, data in enumerate(DEMO_PRODUCTS):
            # Assign realistic authenticity badges
            is_gi = i in (0, 3)
            is_women = i in (0, 1, 4)
            is_sust = i in (0, 1, 4)
            coll_id = kolhapur_collective.id if i % 2 == 0 else kutch_collective.id

            product = Product(
                artisan_id=artisan.id,
                collective_id=coll_id,
                is_gi_tagged=is_gi,
                is_handmade_verified=True,
                is_women_led=is_women,
                is_sustainable=is_sust,
                doorstep_pickup_status="pickup_scheduled" if i == 0 else None,
                **data,
            )
            db.add(product)
            products.append(product)
        db.flush()

        # Demo orders with delivery statuses
        published = [p for p in products if p.status == "published"]
        if published:
            orders_data = [
                (published[0], "Coastal Interiors Pvt Ltd", 4, "fulfilled", "delivered", "Mumbai, Maharashtra"),
                (published[0], "Anita R.", 1, "fulfilled", "shipped", "Pune, Maharashtra"),
                (published[-1], "Regional Handicrafts Store", 6, "pending", "pickup_scheduled", "Bangalore, Karnataka"),
            ]
            for product, buyer, qty, status_, del_status, addr in orders_data:
                db.add(
                    Order(
                        product_id=product.id,
                        artisan_id=artisan.id,
                        buyer_name=buyer,
                        quantity=qty,
                        unit_price=product.price,
                        total_amount=product.price * qty,
                        status=status_,
                        delivery_status=del_status,
                        shipping_address=addr,
                        pickup_address="Patil Craft Workshop, Walwa, Sangli, MH 416313",
                        pickup_agent="SpeedPost Rural Agent #14",
                        pickup_date="2026-09-18",
                        tracking_reference=f"KRG-IN-{product.id[:6].upper()}",
                    )
                )

        # Seed Customer Appreciations ("Thank the Artisan ❤️")
        appreciations = [
            Appreciation(
                artisan_id=artisan.id,
                product_id=published[0].id if published else None,
                buyer_name="Pooja Sharma",
                buyer_location="Mumbai",
                message="The bamboo basket is absolutely stunning! The finish is so smooth and natural. Thank you Savita-ji for your wonderful work! ❤️",
                rating_stars=5,
            ),
            Appreciation(
                artisan_id=artisan.id,
                product_id=published[1].id if len(published) > 1 else None,
                buyer_name="Arjun Mehta",
                buyer_location="Bengaluru",
                message="Received the artwork in pristine condition. Your hand-painted strokes bring so much warmth to our living room. Wishing you continued success!",
                rating_stars=5,
            ),
        ]
        db.add_all(appreciations)

        db.commit()
        logger.info("Seeded demo artisan %s with %d products, story, and collectives.", artisan.id, len(products))

    # Seed demo enquiries if enquiries table is empty
    if db.query(Enquiry).count() == 0 and artisan:
        products = db.query(Product).all()
        prod_map = {p.product_name: p.id for p in products}
        for eq_data in DEMO_ENQUIRIES:
            p_id = prod_map.get(eq_data["product_name"])
            db.add(
                Enquiry(
                    product_id=p_id,
                    artisan_id=artisan.id,
                    buyer_name=eq_data["buyer_name"],
                    buyer_contact=eq_data["buyer_contact"],
                    product_name=eq_data["product_name"],
                    message=eq_data["message"],
                    status=eq_data.get("status", "new"),
                    response_message=eq_data.get("response_message"),
                    is_demo_data=True,
                )
            )
        db.commit()
        logger.info("Seeded initial demo enquiries into enquiries table.")

    return artisan


def main() -> None:
    configure_logging()
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
