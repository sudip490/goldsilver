"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsItem } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { ExternalLink, Clock } from "lucide-react";

interface NewsListProps {
    news: NewsItem[];
}

export function NewsList({ news }: NewsListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Latest News & Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {news.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <div className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                            <span className="font-medium">{item.source}</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(item.publishedAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
