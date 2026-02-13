import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly service: ProjectsService) { }

    @Get()
    findAll(@Query('status') status?: string) {
        return this.service.findAll(status);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.service.create(body);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.service.remove(id);
    }

    // Milestones
    @Post(':id/milestones')
    addMilestone(@Param('id') id: number, @Body() body: any) {
        return this.service.addMilestone(id, body);
    }

    @Put('milestones/:milestoneId')
    updateMilestone(@Param('milestoneId') milestoneId: number, @Body() body: any) {
        return this.service.updateMilestone(milestoneId, body);
    }

    @Delete('milestones/:milestoneId')
    removeMilestone(@Param('milestoneId') milestoneId: number) {
        return this.service.removeMilestone(milestoneId);
    }
}
