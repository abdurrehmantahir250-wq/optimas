"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { File, Folder, Download, Upload, Trash2, Edit2, MoreVertical, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export default function FilesPage() {
  const [selectedDevice, setSelectedDevice] = useState("device-1");
  const [currentPath, setCurrentPath] = useState("/storage/emulated/0");
  const [searchQuery, setSearchQuery] = useState("");

  const files = [
    { id: 1, name: "DCIM", type: "folder", size: "12.5 GB", modified: "2 hours ago" },
    { id: 2, name: "Documents", type: "folder", size: "2.3 GB", modified: "1 day ago" },
    { id: 3, name: "Downloads", type: "folder", size: "5.6 GB", modified: "30 mins ago" },
    { id: 4, name: "vacation.pdf", type: "file", size: "14.2 MB", modified: "3 days ago", icon: "📄" },
    { id: 5, name: "presentation.pptx", type: "file", size: "8.7 MB", modified: "1 week ago", icon: "📊" },
    { id: 6, name: "backup.zip", type: "file", size: "156 MB", modified: "2 weeks ago", icon: "📦" },
    { id: 7, name: "audio.mp3", type: "file", size: "5.2 MB", modified: "1 month ago", icon: "🎵" },
  ];

  const breadcrumbs = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">File Manager</h1>
            <p className="text-muted-foreground">Browse and manage files on your devices</p>
          </div>

          {/* Device selector and controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
              >
                <option value="device-1">Samsung Galaxy S24</option>
                <option value="device-2">iPhone 15 Pro</option>
                <option value="device-3">Pixel 8</option>
              </select>
            </div>
            <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 rounded-lg group inline-flex items-center gap-2 whitespace-nowrap">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button variant="outline" className="border-border hover:bg-accent/10 px-6 rounded-lg inline-flex items-center gap-2 whitespace-nowrap">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* Breadcrumb navigation */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <button className="text-muted-foreground hover:text-foreground transition-colors">/</button>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  {crumb}
                </button>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Files list */}
          <div className="space-y-2">
            {files.map((file) => (
              <Card
                key={file.id}
                className="p-4 border border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-sidebar rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.type === "folder" ? (
                        <Folder className="w-5 h-5" />
                      ) : (
                        <File className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.name}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.modified}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.type === "file" && (
                      <>
                        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors" title="Rename">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                    <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Upload area */}
          <div className="mt-12 p-8 border-2 border-dashed border-border rounded-lg bg-accent/5 text-center hover:bg-accent/10 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">Drop files here to upload</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to select files</p>
            <Button variant="outline" className="border-border">
              Select Files
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
