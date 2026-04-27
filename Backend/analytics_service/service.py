from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, extract, case, text
from models.models import Shipment, Document, HSNClassification, RiskAssessment, Duty

async def get_dashboard_summary(db: AsyncSession, start_date: str = None, end_date: str = None):
    from datetime import datetime
    
    # Parse dates if provided
    start_dt = None
    end_dt = None
    if start_date:
        try:
            # Flexible parsing for common JS date formats
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            start_dt = start_dt.replace(tzinfo=None) # Make naive for SQLAlchemy
        except:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            end_dt = end_dt.replace(tzinfo=None) # Make naive for SQLAlchemy
        except:
            pass

    def apply_filters(stmt, model):
        date_col = None
        if hasattr(model, 'created_at'):
            date_col = model.created_at
        elif hasattr(model, 'calculated_at'):
            date_col = model.calculated_at
        
        if date_col is None:
            return stmt

        if start_dt:
            stmt = stmt.where(date_col >= start_dt)
        if end_dt:
            stmt = stmt.where(date_col <= end_dt)
        return stmt

    # 🚀 INITIALIZE DEFAULTS (Prevent UnboundLocalError)
    shipments_count = docs_count = risk_alerts = 0
    total_revenue_val = total_expenses_val = paid_amount = 0
    hsn_classified_count = peak_value_val = min_price_val = 0
    duty_sum = tax_sum = other_sum = 0

    # Grouped execution to avoid concurrent session errors while maintaining efficiency
    try:
        # 1. Shipment Metrics
        shp_stmt = apply_filters(select(
            func.count(Shipment.id),
            func.sum(Shipment.total_value),
            func.min(Shipment.unit_price),
            func.max(Shipment.total_value),
            func.sum(case((Shipment.status == 'Delivered', Shipment.total_value), else_=0))
        ), Shipment)
        shp_res = await db.execute(shp_stmt)
        shp_row = shp_res.first()
        
        if shp_row:
            shipments_count = shp_row[0] or 0
            total_revenue_val = float(shp_row[1] or 0)
            min_price_val = float(shp_row[2] or 0)
            peak_value_val = float(shp_row[3] or 0)
            paid_amount = float(shp_row[4] or 0)

        # 2. Duty Metrics
        duty_stmt = apply_filters(select(
            func.sum(Duty.total_cost),
            func.sum(Duty.duty_amount),
            func.sum(Duty.tax_amount),
            func.sum(Duty.other_charges)
        ), Duty)
        duty_res = await db.execute(duty_stmt)
        duty_row = duty_res.first()
        
        if duty_row:
            total_expenses_val = float(duty_row[0] or 0)
            duty_sum = float(duty_row[1] or 0)
            tax_sum = float(duty_row[2] or 0)
            other_sum = float(duty_row[3] or 0)

        # 3. Document Count
        docs_res = await db.execute(apply_filters(select(func.count(Document.id)), Document))
        docs_count = docs_res.scalar() or 0

        # 4. Risk Alerts
        risk_res = await db.execute(apply_filters(select(func.count(RiskAssessment.id)).where(RiskAssessment.risk_level == 'High'), RiskAssessment))
        risk_alerts = risk_res.scalar() or 0

        # 5. HSN Count
        hsn_res = await db.execute(apply_filters(select(func.count(HSNClassification.id)), HSNClassification))
        hsn_classified_count = hsn_res.scalar() or 0

    except Exception as e:
        print(f"❌ Analytics Query Error: {e}")
        # Defaults already set at top

    pending_amount = total_revenue_val - paid_amount
    growth_rate = 1.05 
    forecast_30 = total_revenue_val * growth_rate / 3.0 
    
    category_dist = [
        {"name": "Customs Duty", "value": duty_sum, "color": "#3b82f6"},
        {"name": "Tax / VAT", "value": tax_sum, "color": "#10b981"},
        {"name": "Other Charges", "value": other_sum, "color": "#f59e0b"},
        {"name": "Operational Misc", "value": total_expenses_val * 0.1, "color": "#64748b"},
    ]

    # Payment Methods Breakdown (Simulated based on status for now)
    payment_methods = [
        {"name": "Bank Transfer", "value": paid_amount * 0.7, "color": "#3b82f6"},
        {"name": "Credit Card", "value": paid_amount * 0.2, "color": "#818cf8"},
        {"name": "Net Banking", "value": paid_amount * 0.1, "color": "#94a3b8"},
    ]

    # History and Product Performance parallelization
    hist_stmt = apply_filters(select(
        extract('year', Shipment.created_at).label('year'),
        extract('month', Shipment.created_at).label('month'),
        func.sum(Shipment.total_value).label('revenue'),
        func.count(Shipment.id).label('count')
    ), Shipment).group_by(extract('year', Shipment.created_at), extract('month', Shipment.created_at)).order_by(extract('year', Shipment.created_at), extract('month', Shipment.created_at))

    perf_stmt = apply_filters(select(
        Shipment.product_name, 
        func.count(Shipment.id).label('count'),
        func.sum(Shipment.total_value).label('value')
    ).group_by(Shipment.product_name), Shipment).limit(10)

    hist_res = await db.execute(hist_stmt)
    perf_res = await db.execute(perf_stmt)

    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    history_series = []
    for row in hist_res.all():
        try:
            year_val = int(row[0]) if row[0] is not None else 2024
            month_idx = int(row[1]) if row[1] is not None else 1
            
            history_series.append({
                "month": f"{month_names[month_idx]} {year_val}" if 0 < month_idx < 13 else f"{month_idx}/{year_val}",
                "revenue": float(row[2] or 0),
                "expenses": float(row[2] or 0) * 0.15,
                "transactions": int(row[3] or 0)
            })
        except (ValueError, TypeError, IndexError):
            continue

    product_performance = []
    for row in perf_res.all():
        product_performance.append({
            "name": row[0],
            "count": row[1],
            "value": float(row[2] or 0),
            "color": "#3b82f6"
        })

    if not history_series:
        history_series = [{"month": "No Data", "revenue": 0, "expenses": 0, "transactions": 0}]
    if not product_performance:
        product_performance = [{"name": "No Data", "count": 0, "value": 0, "color": "#cbd5e1"}]

    return {
        "summary": {
            "total_revenue": f"₹{total_revenue_val:,.0f}",
            "total_expenses": f"₹{total_expenses_val:,.0f}",
            "avg_expense": f"₹{(total_expenses_val / (shipments_count if shipments_count > 0 else 1)):,.0f}",
            "paid_amount": f"₹{paid_amount:,.0f}",
            "pending_amount": f"₹{pending_amount:,.0f}",
            "total_invoices": docs_count,
            "shipments_count": shipments_count,
            "risk_alerts": risk_alerts,
            "paid_percent": f"{(paid_amount / total_revenue_val * 100) if total_revenue_val > 0 else 0:.1f}%",
            "avg_price": f"₹{(total_revenue_val / (shipments_count if shipments_count > 0 else 1)):,.0f}",
            "min_price": f"₹{min_price_val:,.0f}",
            "peak_value": f"₹{peak_value_val:,.0f}",
        },
        "forecasts": {
            "30_day": f"₹{forecast_30:,.0f}",
            "60_day": f"₹{(forecast_30 * 2):,.0f}",
            "90_day": f"₹{(forecast_30 * 3):,.0f}"
        },
        "category_distribution": category_dist,
        "payment_methods": payment_methods,
        "hsn_status": [
            {"name": "Classified", "value": int(hsn_classified_count), "color": "#10b981"},
            {"name": "Pending", "value": int(shipments_count - hsn_classified_count), "color": "#3b82f6"},
            {"name": "Error", "value": 0, "color": "#f43f5e"},
        ],
        "history": history_series,
        "product_performance": product_performance
    }

async def get_risk_analytics(db: AsyncSession):
    # Aggregated Risk Distribution
    levels = ["High", "Medium", "Low"]
    risk_dist = []
    for level in levels:
        count_res = await db.execute(select(func.count(RiskAssessment.id)).where(RiskAssessment.risk_level == level))
        risk_dist.append({"level": level, "count": count_res.scalar() or 0})

    # Top Risk Shipments (Recent)
    top_risks_stmt = select(RiskAssessment, Shipment).join(Shipment).order_by(RiskAssessment.risk_score.desc()).limit(10)
    result = await db.execute(top_risks_stmt)
    top_entries = []
    for risk, shipment in result:
        top_entries.append({
            "id": risk.id,
            "shipment": shipment.shipment_code,
            "score": float(risk.risk_score),
            "level": risk.risk_level,
            "reason": risk.reason,
            "duty": f"₹{float(risk.risk_score * 1000):,.0f}"
        })

    # Total Duty metrics
    duty_sum_res = await db.execute(select(func.sum(Duty.total_cost)))
    total_duty = float(duty_sum_res.scalar() or 0)

    # Real Avg Risk Score
    avg_score_res = await db.execute(select(func.avg(RiskAssessment.risk_score)))
    avg_score = float(avg_score_res.scalar() or 0)

    return {
        "distribution": risk_dist,
        "top_entries": top_entries,
        "metrics": {
            "total_duty_est": f"₹{total_duty:,.0f}",
            "high_risk_count": risk_dist[0]["count"] if risk_dist else 0,
            "avg_risk_score": round(avg_score, 1)
        }
    }

async def get_hsn_analytics(db: AsyncSession):
    # Total classified items
    total_res = await db.execute(select(func.count(HSNClassification.id)))
    total = total_res.scalar() or 0

    # Average confidence
    avg_conf_res = await db.execute(select(func.avg(HSNClassification.confidence_score)))
    avg_conf = float(avg_conf_res.scalar() or 0)

    # Top classified products (most recent 50)
    stmt = (
        select(HSNClassification, Shipment)
        .join(Shipment, Shipment.id == HSNClassification.shipment_id)
        .order_by(HSNClassification.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    items = []
    for hsn, shipment in result:
        items.append({
            "id": hsn.id,
            "product": shipment.product_name,
            "hsn_code": hsn.hsn_code,
            "confidence": float(hsn.confidence_score or 0),
            "model_version": hsn.model_version or "Pipeline-v2.0",
            "status": "Verified" if (hsn.confidence_score or 0) > 0.9 else "Review Needed",
            "shipment_code": shipment.shipment_code,
        })

    return {
        "total": total,
        "avg_confidence": round(avg_conf, 1),
        "items": items,
    }
