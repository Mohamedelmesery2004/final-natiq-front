
http://localhost:3001/api/v1/admin/analytics/overview
{
    "success": true,
    "message": "Success",
    "data": {
        "overview": {
            "kpis": {
                "totalSessions": 13,
                "activeSessions": 6,
                "totalTickets": 20,
                "openTickets": 6,
                "inProgressTickets": 6,
                "resolvedTickets": 8,
                "avgFirstResponseTime": 720,
                "avgResolutionTime": 2880
            },
            "heatmap": {
                "chats": [
                    {
                        "date": "2026-06-04",
                        "count": 1
                    },
                    {
                        "date": "2026-06-06",
                        "count": 1
                    },
                    {
                        "date": "2026-06-08",
                        "count": 1
                    },
                    {
                        "date": "2026-06-10",
                        "count": 1
                    },
                    {
                        "date": "2026-06-12",
                        "count": 1
                    },
                    {
                        "date": "2026-06-13",
                        "count": 1
                    },
                    {
                        "date": "2026-06-16",
                        "count": 1
                    },
                    {
                        "date": "2026-06-19",
                        "count": 1
                    },
                    {
                        "date": "2026-06-20",
                        "count": 1
                    },
                    {
                        "date": "2026-06-22",
                        "count": 1
                    },
                    {
                        "date": "2026-06-24",
                        "count": 1
                    },
                    {
                        "date": "2026-06-25",
                        "count": 1
                    },
                    {
                        "date": "2026-06-28",
                        "count": 1
                    }
                ],
                "tickets": [
                    {
                        "date": "2026-06-02",
                        "count": 1
                    },
                    {
                        "date": "2026-06-03",
                        "count": 1
                    },
                    {
                        "date": "2026-06-04",
                        "count": 1
                    },
                    {
                        "date": "2026-06-06",
                        "count": 1
                    },
                    {
                        "date": "2026-06-07",
                        "count": 1
                    },
                    {
                        "date": "2026-06-08",
                        "count": 1
                    },
                    {
                        "date": "2026-06-10",
                        "count": 1
                    },
                    {
                        "date": "2026-06-12",
                        "count": 1
                    },
                    {
                        "date": "2026-06-13",
                        "count": 1
                    },
                    {
                        "date": "2026-06-14",
                        "count": 1
                    },
                    {
                        "date": "2026-06-16",
                        "count": 1
                    },
                    {
                        "date": "2026-06-18",
                        "count": 1
                    },
                    {
                        "date": "2026-06-19",
                        "count": 1
                    },
                    {
                        "date": "2026-06-20",
                        "count": 1
                    },
                    {
                        "date": "2026-06-22",
                        "count": 1
                    },
                    {
                        "date": "2026-06-23",
                        "count": 1
                    },
                    {
                        "date": "2026-06-24",
                        "count": 1
                    },
                    {
                        "date": "2026-06-25",
                        "count": 1
                    },
                    {
                        "date": "2026-06-26",
                        "count": 1
                    },
                    {
                        "date": "2026-06-28",
                        "count": 1
                    }
                ]
            },
            "topCategories": [
                {
                    "category": "refund",
                    "count": 3
                },
                {
                    "category": "packages",
                    "count": 3
                },
                {
                    "category": "payment",
                    "count": 3
                },
                {
                    "category": "complaint",
                    "count": 3
                },
                {
                    "category": "billing",
                    "count": 3
                },
                {
                    "category": "network",
                    "count": 3
                },
                {
                    "category": "other",
                    "count": 2
                }
            ],
            "topChannels": [
                {
                    "channel": "web",
                    "count": 13
                }
            ],
            "topIntents": [
                {
                    "intent": "complaint",
                    "count": 4
                },
                {
                    "intent": "payment_issue",
                    "count": 4
                },
                {
                    "intent": "return_request",
                    "count": 4
                },
                {
                    "intent": "product_availability",
                    "count": 4
                },
                {
                    "intent": "package_info",
                    "count": 4
                },
                {
                    "intent": "shipping_info",
                    "count": 3
                },
                {
                    "intent": "order_status",
                    "count": 3
                },
                {
                    "intent": "change_order",
                    "count": 3
                },
                {
                    "intent": "billing_inquiry",
                    "count": 2
                },
                {
                    "intent": "size_help",
                    "count": 2
                }
            ],
            "topAgents": [
                {
                    "_id": "6a417ed70ccdf6e1b0c4444e",
                    "resolvedCount": 2,
                    "agentId": "6a417ed70ccdf6e1b0c4444e",
                    "name": "Omar Hassan",
                    "email": "omar@primestore.com"
                },
                {
                    "_id": "6a417ed90ccdf6e1b0c44450",
                    "resolvedCount": 1,
                    "agentId": "6a417ed90ccdf6e1b0c44450",
                    "name": "Khaled Youssef",
                    "email": "khaled.agent@primestore.com"
                },
                {
                    "_id": "6a417ed80ccdf6e1b0c4444f",
                    "resolvedCount": 1,
                    "agentId": "6a417ed80ccdf6e1b0c4444f",
                    "name": "Fatima Ali",
                    "email": "fatima@primestore.com"
                }
            ]
        }
    }
}
http://localhost:3001/api/v1/admin/management/dashboard
{
    "success": true,
    "data": {
        "dashboard": {
            "overview": {
                "healthScore": 56,
                "status": "good",
                "workloadLevel": "low",
                "riskLevel": "moderate"
            },
            "kpis": {
                "totalAgents": 3,
                "totalManagers": 1,
                "totalTeamLeaders": 1,
                "totalWorkforce": 5,
                "totalTickets": 20,
                "openTickets": 12,
                "resolvedTickets": 8,
                "ticketsToday": 1,
                "ticketsLast7Days": 6,
                "ticketsDelta": 50,
                "resolutionRate": 40,
                "workloadPerAgent": 4,
                "activeManagers": 1,
                "managerActivationRate": 100,
                "activeChats": 6,
                "totalChats": 13,
                "chatLoadPerAgent": 2,
                "agentUtilization": 20,
                "avgFirstResponseTime": 720,
                "avgResolutionTime": 2880
            },
            "todayStats": {
                "ticketsToday": 1,
                "resolvedToday": 0,
                "avgResponseToday": 0,
                "avgResolutionToday": 0
            },
            "slaStats": {
                "overdueTickets": 11,
                "dueSoon": 0,
                "breachedTickets": 8
            },
            "productivity": {
                "ticketsPerHour": 28.77,
                "avgHandlingTime": 2880,
                "activeTimeSec": 1001
            },
            "performanceTrend": [
                {
                    "date": "2026-05-29",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-05-30",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-05-31",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-01",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-02",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-03",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-04",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-05",
                    "assigned": 0,
                    "resolved": 1
                },
                {
                    "date": "2026-06-06",
                    "assigned": 1,
                    "resolved": 1
                },
                {
                    "date": "2026-06-07",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-08",
                    "assigned": 1,
                    "resolved": 1
                },
                {
                    "date": "2026-06-09",
                    "assigned": 0,
                    "resolved": 1
                },
                {
                    "date": "2026-06-10",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-11",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-12",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-13",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-14",
                    "assigned": 1,
                    "resolved": 1
                },
                {
                    "date": "2026-06-15",
                    "assigned": 0,
                    "resolved": 1
                },
                {
                    "date": "2026-06-16",
                    "assigned": 1,
                    "resolved": 1
                },
                {
                    "date": "2026-06-17",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-18",
                    "assigned": 1,
                    "resolved": 1
                },
                {
                    "date": "2026-06-19",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-20",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-21",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-22",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-23",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-24",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-25",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-26",
                    "assigned": 1,
                    "resolved": 0
                },
                {
                    "date": "2026-06-27",
                    "assigned": 0,
                    "resolved": 0
                },
                {
                    "date": "2026-06-28",
                    "assigned": 1,
                    "resolved": 0
                }
            ],
            "callPerformance": {
                "totalCalls": 12,
                "answered": 7,
                "missed": 5,
                "avgDuration": 133,
                "answerRate": 58
            },
            "channelDistribution": [
                {
                    "name": "Web",
                    "count": 20,
                    "percentage": 100
                }
            ],
            "feedbackStats": {
                "totalRatings": 8,
                "avgRating": 3.9,
                "csat": 63,
                "ratingBreakdown": {
                    "1": 0,
                    "2": 0,
                    "3": 3,
                    "4": 3,
                    "5": 2
                }
            },
            "csatUI": {
                "percentage": 63,
                "label": "Average",
                "color": "orange",
                "trend": 0
            },
            "recentActivity": [
                {
                    "type": "ticket_created",
                    "ticketId": "6a417ede0ccdf6e1b0c444c0",
                    "label": "Created ticket #c444c0",
                    "timeAgo": "23min ago"
                },
                {
                    "type": "ticket_created",
                    "ticketId": "6a417ede0ccdf6e1b0c444bf",
                    "label": "Created ticket #c444bf",
                    "timeAgo": "2d ago"
                }
            ],
            "topCategories": [
                {
                    "name": "payment",
                    "count": 3
                },
                {
                    "name": "refund",
                    "count": 3
                },
                {
                    "name": "complaint",
                    "count": 3
                },
                {
                    "name": "network",
                    "count": 3
                },
                {
                    "name": "billing",
                    "count": 3
                },
                {
                    "name": "packages",
                    "count": 3
                },
                {
                    "name": "other",
                    "count": 2
                }
            ],
            "goalProgress": {
                "total": 500,
                "current": 8,
                "percentage": 2,
                "dailyTarget": 1
            },
            "workload": {
                "used": 0,
                "total": 500,
                "percentage": 0,
                "level": "low"
            },
            "insights": [
                {
                    "type": "critical",
                    "metric": "overdueTickets",
                    "message": "11 tickets past SLA deadline",
                    "severity": "high"
                },
                {
                    "type": "warning",
                    "metric": "breachedTickets",
                    "message": "8 tickets breached SLA",
                    "severity": "medium"
                },
                {
                    "type": "warning",
                    "metric": "answerRate",
                    "message": "Call answer rate is low (58%)",
                    "severity": "high"
                },
                {
                    "type": "warning",
                    "metric": "resolutionRate",
                    "message": "Resolution rate is low (40%)",
                    "severity": "high"
                },
                {
                    "type": "info",
                    "metric": "resolvedToday",
                    "message": "No tickets resolved yet today",
                    "severity": "low"
                }
            ],
            "suggestions": [
                {
                    "type": "quality",
                    "action": "train",
                    "message": "Improve resolution quality through agent training and knowledge base updates",
                    "priority": "high"
                },
                {
                    "type": "optimization",
                    "action": "coach",
                    "message": "Coach agents on call handling to improve answer rate",
                    "priority": "medium"
                }
            ]
        }
    }
}